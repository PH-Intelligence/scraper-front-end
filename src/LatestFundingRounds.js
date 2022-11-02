import * as React from 'react';
import { useState, useEffect, useRef } from "react";
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import GenericDataTable from './GenericDataTable';
import Copyright from './Copyright';
import { supabase } from './supabaseClient';
import { Link } from "react-router-dom";
import { findFlagFromCountry } from './country_flags.js';
import ApexCharts from 'apexcharts';

export default function LatestFundingRounds(props) {

  var currency_mapping = {
    "EUR": "🇪🇺 €",
    "GBP": "🇬🇧 £",
    "CAD": "🇨🇦 $",
    "INR": "🇮🇳 ₹"
  };

  const columns = [
    // { field: 'id', headerName: 'ID' },
    { field: 'earliest_pub_date', headerName: 'Date', valueFormatter: (params) => { return new Date(params.value).toLocaleString(undefined, {year: "numeric", month: "numeric", day: "numeric"}) }, flex: 0.5 }, // https://stackoverflow.com/a/34015511/3593246
    { field: 'company', headerName: 'Company', valueGetter: (params) => { return `${findFlagFromCountry(params.row.location ? params.row.location : '')} ${params.row.company}` }, flex: 1 },
    { field: 'amount', headerName: 'Total Round Amount (US$)', valueGetter: (params) => { return params.row.usd_normalized },
      renderCell: (params: GridRenderCellParams<Number>) => (
        <div>
        {params.row.usd_normalized ? '$' + Math.round(params.row.usd_normalized).toLocaleString() : ''}<br/><small>{params.row.currency != '' && params.row.currency != 'USD' ? currency_mapping[params.row.currency] + params.row.funding_amount.toLocaleString() : ''}</small>
        </div>
      ), type: 'number', flex: 0.75 },
    { field: 'funding_round', headerName: 'Round', flex: 0.5},
    { field: 'vc_funds', headerName: 'Investors', valueGetter: (params) => {return params.row.vc_funds}, renderCell: (params) => (
      <div>
        {params.row.vc_funds.map(x =>
          <React.Fragment key={x.id}>
            <span>
              {findFlagFromCountry(x.country ? x.country : '')} <Link to={`/vc-funds/${x.id}`}>{x.fund}</Link>
            </span><br/>
          </React.Fragment>
        )}
      </div>
    ), flex: 0.5},
    { field: 'news_coverage', headerName: 'News Coverage', valueGetter: (params) => {return params.row.funding_round_news_items}, renderCell: (params) => (
      <div>
        {params.row.funding_round_news_items.map(x =>
          <React.Fragment key={x.id}>
            <span>
              <a href={x.link} target="_blank">{x.title}</a> <small>{new Date(x.pub_date).toLocaleString(undefined, {year: "numeric", month: "numeric", day: "numeric"})}</small>
            </span><br/>
          </React.Fragment>
        )}
      </div>
    ), flex: 1}
  ];

  var rounds_order = [
    'Pre-Seed',
    'Seed',
    'Angel',
    'Pre-Series A',
    'Series A',
    'Pre-Series B',
    'Series B',
    'Series C',
    'Series D',
    'Series E',
    'Series F',
    'Series G',
    ''
  ];

  // From here: https://snippets.bentasker.co.uk/page-1907020841-Calculating-Mean,-Median,-Mode,-Range-and-Percentiles-with-Javascript-Javascript.html
  /** Calculate the 'q' quartile of an array of values
  *
  * @arg arr - array of values
  * @arg q - percentile to calculate (e.g. 95)
  */
  function calcQuartile(arr,q){
    var a = arr.slice();
    // Turn q into a decimal (e.g. 95 becomes 0.95)
    q = q/100;

    // Sort the array into ascending order
    var data = a.sort((a,b) => a - b);

    // Work out the position in the array of the percentile point
    var p = ((data.length) - 1) * q;
    var b = Math.floor(p);

    // Work out what we rounded off (if anything)
    var remainder = p - b;

    // See whether that data exists directly
    if (data[b+1]!==undefined){
        return parseFloat(data[b]) + remainder * (parseFloat(data[b+1]) - parseFloat(data[b]));
    }else{
        return parseFloat(data[b]);
    }
  }

  const [companyData, setCompanyData] = useState([]);
  const loggedIn = useRef(-1);
  const isLoading = useRef(false);

  useEffect(() => {

    loggedIn.current = props.logged_in;

    if (loggedIn.current == -1) {
      console.log('Home.js has not yet loaded login info');
      return;
    }

    if (isLoading.current) {
      console.log('Home.js already in process of loading VC funds data, so do not call the API again');
      return;
    }

    isLoading.current = true;

    (async() => {

      // console.log('Async portion starting');

      var data, error;

      ({data, error} = await supabase.from('funding_rounds')
      .select(`
        id,
        company,
        location,
        funding_amount,
        currency,
        usd_normalized,
        funding_round,
        earliest_pub_date,
        funding_round_news_items (
          id,
          guid,
          link,
          title,
          pub_date
        ),
        vc_funds (
          id,
          fund,
          country,
          clearbit_logo,
          clearbit_domain
        )
      `).order('earliest_pub_date', { ascending: false }))
      console.log('We have just made 1 DB call');


      if (error)
        console.log('Error occurred:', error)
      else
        console.log(data);
        isLoading.current = false;
        if (JSON.stringify(data) != JSON.stringify(companyData)) {
          setCompanyData(data);
          console.log(data);

          var chart_formatted_data = [];
          for (var round of rounds_order) {
            var round_data = data.filter(x => x.funding_round == round && x.usd_normalized != null).map(y => y.usd_normalized);
            if (round_data.length == 0) {
              continue;
            }
            chart_formatted_data.push({
              x: round,
              y: [Math.min(...round_data), calcQuartile(round_data, 25), calcQuartile(round_data, 50), calcQuartile(round_data, 75), Math.max(...round_data)]
            });
          }

          console.log(chart_formatted_data);

          var options = {
            series: [
              {
                data: chart_formatted_data
              }
            ],
            chart: {
              type: 'boxPlot',
              height: 500
            },
            title: {
              text: 'Amounts by Funding Round',
              align: 'left'
            },
            plotOptions: {
              bar: {
                horizontal: true
              }
            },
            xaxis: {
              labels: {
                formatter: function (value) {
                  return "$" + value.toLocaleString();
                }
              },
            },
            tooltip: {
              custom: function({ seriesIndex, dataPointIndex, w }) {
                // console.log(w);
                const min = w.globals.seriesCandleO[seriesIndex][dataPointIndex]
                const low = w.globals.seriesCandleH[seriesIndex][dataPointIndex]
                const median = w.globals.seriesCandleM[seriesIndex][dataPointIndex]
                const high = w.globals.seriesCandleL[seriesIndex][dataPointIndex]
                const max = w.globals.seriesCandleC[seriesIndex][dataPointIndex]
                return (
                  '<div class="apexcharts-tooltip-candlestick">' +
                  '<div>Min: <span class="value">$' +
                  min.toLocaleString() +
                  '</span></div>' +
                  '<div>25th Percentile: <span class="value">$' +
                  low.toLocaleString() +
                  '</span></div>' +
                  '<div>Median: <span class="value">$' +
                  median.toLocaleString() +
                  '</span></div>' +
                  '<div>75th Percentile: <span class="value">$' +
                  high.toLocaleString() +
                  '</span></div>' +
                  '<div>Max: <span class="value">$' +
                  max.toLocaleString() +
                  '</span></div>' +
                  '</div>'
                )
              }
            }
          };

          var chart = new ApexCharts(document.querySelector("#chart"), options);
          chart.render();

        } else {
          // console.log('The table data is identical to the last one, so do not reset it')
        }

      })()

  }, [props.logged_in])

  return (
    <Container maxWidth="lg">
      <div id="chart"></div>
      <Box sx={{ my: 4 }}>
        <GenericDataTable logged_in={props.logged_in} columns={columns} rows={companyData} />
        <Copyright />
      </Box>
    </Container>
  )

}