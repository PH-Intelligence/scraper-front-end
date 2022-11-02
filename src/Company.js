import * as React from 'react';
import { useState, useEffect, useRef } from "react";
import GenericDataTable from './GenericDataTable';
import { supabase } from './supabaseClient'
import Container from '@mui/material/Container';
import { Link, useParams } from "react-router-dom";
import ApexCharts from 'apexcharts';

export default function Company(props) {

  let { companyId } = useParams();

  const [companyData, setCompanyData] = useState([]);
  const loggedIn = useRef(-1);
  const isLoading = useRef(false);

  const columns = [
    // { field: 'id', headerName: 'ID' },
    { field: 'timestamp', headerName: 'Date & Time', valueFormatter: (params) => { return loggedIn.current ? new Date(params.value * 1000).toLocaleString(undefined, {year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric"}) : new Date(params.value * 1000).toLocaleString(undefined, {year: "numeric", month: "numeric", day: "numeric", hour: "numeric" }) }, flex: 0.75 }, // https://stackoverflow.com/a/34015511/3593246
    { field: 'employees', headerName: 'Employees', valueFormatter: (params: GridValueFormatterParams<number>) => {
                if (params.value == null) {
                  return '';
                }
                return params.value.toLocaleString();
              }, flex: 0.5 },
    { field: 'job_openings', headerName: 'Job Openings', valueFormatter: (params: GridValueFormatterParams<number>) => {
                if (params.value == null) {
                  return '';
                }
                return params.value.toLocaleString();
              }, flex: 0.5 }
  ]

  useEffect(() => {

    loggedIn.current = props.logged_in;
    // console.log(loggedIn.current);

    if (loggedIn.current == -1) {
      console.log('Company.js has not yet loaded login info');
      return;
    }

    if (isLoading.current) {
      console.log('Company.js already in process of loading company and jobs data, so do not call the API again');
      return;
    }

    isLoading.current = true;

    (async() => {

      var data, error;
      ({data, error} = await supabase.from('companies')
        .select(`
          id,
          company,
          tags_array,
          linkedin,
          glassdoor,
          clearbit_logo,
          clearbit_domain,
          linkedin_jobs(
            id,
            employees,
            job_openings,
            timestamp
          ),
          sec_data(
            employee_count,
            as_of_date
          )
        `).eq('id', companyId).order('timestamp', {foreignTable: 'linkedin_jobs', ascending: false }))
      console.log('We have just made 1 API call');
      console.log(data);

      if (error)
        console.log('Error occurred:', error)
      else
        if (JSON.stringify(data[0]) != JSON.stringify(companyData)) {
          console.log('Company.js has loaded this: ');
          console.log(data[0]);
          isLoading.current = false;
          setCompanyData(data[0]);

          // "GMT" parts borrowed from here: https://github.com/apexcharts/apexcharts.js/issues/209
          var sorted_data = [...data[0].linkedin_jobs].sort((a, b) => { return a.timestamp - b.timestamp } );
          var data2 = sorted_data.map(a => ({
                  x: new Date(a.timestamp * 1000).toLocaleDateString("en-US") + " GMT",
                  y: null
                }));
          data2.sort((a,b) => {return new Date(a.x) - new Date(b.x) });

          var markers_to_show = [];

          for (var i=0; i < data[0].sec_data.length; i++) {

            var matching_dates = data2.filter(x => x.x == new Date(data[0].sec_data[i].as_of_date).toLocaleDateString("en-US") + " GMT");
            console.log(matching_dates);

            for (var z=0; z < matching_dates.length; z++) {
              var model_match = Object.assign(matching_dates[z], {y: null});
              console.log(model_match);
              markers_to_show.push(data2.indexOf(model_match));
              data2.splice(data2.indexOf(model_match), 1, {x: new Date(data[0].sec_data[i].as_of_date).toLocaleDateString("en-US") + " GMT", y: data[0].sec_data[i].employee_count });
            }
          }

          markers_to_show = markers_to_show.map(x => ({
            seriesIndex: 1,
            dataPointIndex: x,
            fillColor: '#00e396',
            strokeColor: '#00e396',
            size: 5,
            shape: "circle" 
          }));

          var data_series = [
            {
              name: 'Employees',
              type: 'line',
              data: sorted_data.map(a => ({
                x: new Date(a.timestamp * 1000).toLocaleDateString("en-US") + " GMT",
                y: a.employees
              }))
            },
            {
              name: 'Verified Employees',
              type: 'line',
              data: data2
            },
            {
              name: 'Job Openings',
              type: 'line',
              data: sorted_data.map(a => ({
                x: new Date(a.timestamp * 1000).toLocaleDateString("en-US") + " GMT",
                y: a.job_openings
              }))
            }
          ];

          var y_axis_min = Math.max(0, Math.min(...sorted_data.map(x => x.employees), ...data2.filter(x => x.y != null).map(x => x.y)) - 100);

          var y_axes = [
            {
              seriesName: 'Employees',
              title: {
                text: 'Employees'
              },
              labels: {
                formatter: function(val, index) {
                  return val.toLocaleString();
                }
              },
              forceNiceScale: true,
              min: y_axis_min
            },
            {
              seriesName: 'Employees',
              labels: {
                formatter: function(val, index) {
                    return val ? `${val.toLocaleString()} (SEC Filing)` : null;
                }
              },
              forceNiceScale: true,
              min: y_axis_min,
              show: false
            },
            {
              opposite: true,
              seriesName: 'Job Openings',
              title: {
                text: 'Job Openings'
              },
              labels: {
                formatter: function(val, index) {
                  return val.toLocaleString();
                }
              },
              forceNiceScale: true,
              min: Math.min(...sorted_data.map(x => x.job_openings))
            }
          ];

          var chart_colors = ['#008ffb', '#00e396', '#feb019'];

          if (markers_to_show.length == 0) {
            data_series.splice(1,1);
            y_axes.splice(1,1);
            chart_colors.splice(1,1);
          }

          

          var options = {
            chart: {
              type: 'line',
              height: 400
            },
            colors: chart_colors,
            series: data_series,
            xaxis: {
              // categories: sorted_data.map(x => new Date(x.timestamp * 1000).toLocaleDateString("en-US")),
              type: 'datetime',
              hideOverlappingLabels: true
              // showDuplicates: false
            },
            yaxis: y_axes,
            stroke: {
              width: 2,
              curve: 'smooth'
            },
            tooltip: {
              shared: true,
              theme: 'dark'
            },
            markers: {
              discrete: markers_to_show
            }
          }
          var chart = new ApexCharts(document.querySelector("#chart"), options);
          console.log(options);
          chart.render();

        }

    })()

  }, [props.logged_in, companyId])

  return (
    <>
      <Container>
        {
          companyData != null && companyData.clearbit_logo != null ?
          (companyData.clearbit_domain != null ? (<a href={'https://' + companyData.clearbit_domain} target="_blank"><img src={companyData.clearbit_logo} height="50" /></a>) : (<img src={companyData.clearbit_logo} height="50" />)
          )
          :
          ""
        }
        <h3 style={{marginBottom: '3px'}}>{companyData != null ? companyData.company : ''}</h3>
        <div style={{marginBottom: '15px'}}>
        { companyData.tags_array && companyData.tags_array.length > 0 ? companyData.tags_array.map(x => <React.Fragment key={x}><span style={{backgroundColor: '#add4ce', borderRadius: '10px', padding: '0px 5px'}}>{x}</span>&nbsp;</React.Fragment>) : '' }
        </div>
        {
          companyData != null && companyData.linkedin != null ?
          (<a href={companyData.linkedin} target="_blank"><img src={process.env.PUBLIC_URL + '/linkedin.png'} height="21" /></a>)
          :
          ""
        }
        {
          companyData != null && companyData.glassdoor != null ?
          (<a href={companyData.glassdoor} target="_blank"><img src={process.env.PUBLIC_URL + '/glassdoor.png'} height="21" /></a>)
          :
          ""
        }
        <div id='chart'></div>
      </Container>
      <Container>
        <GenericDataTable logged_in={props.logged_in} columns={columns} rows={companyData ? companyData.linkedin_jobs : []} />
      </Container>
    </>
    )
}