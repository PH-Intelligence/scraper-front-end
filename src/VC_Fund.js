// import { useState, useEffect, useRef } from "react";
import GenericDataTable from './GenericDataTable';
import { supabase } from './supabaseClient'
import Container from '@mui/material/Container';
import { Link, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { findFlagFromCountry } from './country_flags.js'

export default function VC_Fund(props) {
  let { vcId } = useParams();

  const [vcData, setVcData] = useState(null);
  const loggedIn = useRef(-1);
  const isLoading = useRef(false);

  const columns = [
    { field: 'fund', headerName: 'VC Fund', valueGetter: (params) => { return `${findFlagFromCountry(params.row.country)} ${params.row.fund}` }, flex: 1 },
    { field: 'company', headerName: 'Company', valueGetter: (params) => { return `${findFlagFromCountry(params.row.location ? params.row.location : '')} ${params.row.company}` }, flex: 0.5 },
    { field: 'usd_normalized', headerName: 'Total Round Amount (US$)', valueFormatter: (params: GridValueFormatterParams<number>) => {
              if (params.value == null) {
                return '';
              }
              return '$' + params.value.toLocaleString();
            }, flex: 0.5 },
    { field: 'funding_round', headerName: 'Round', flex: 0.5 }
  ]

  useEffect(() => {

    loggedIn.current = props.logged_in;
    // console.log(loggedIn.current);

    if (loggedIn.current == -1) {
      console.log('VC_Fund.js has not yet loaded login info');
      return;
    }

    if (isLoading.current) {
      console.log('VC_Fund.js already in process of loading VC funds data, so do not call the API again');
      return;
    }

    isLoading.current = true;

    (async() => {

      var data, error;
      ({data, error} = await supabase.from('vc_funds')
        .select(`
          id,
          fund,
          country,
          funding_rounds (
            id,
            company,
            funding_amount,
            currency,
            usd_normalized,
            funding_round,
            location
          )
        `).eq('id', vcId).order('earliest_pub_date', {foreignTable: 'funding_rounds', ascending: false }))
      console.log('We have just made 1 API call');

      if (error)
        console.log('Error occurred:', error)
      else
        if (JSON.stringify(data[0]) != JSON.stringify(vcData)) {
          console.log('VC_Fund.js has loaded this: ');
          console.log(data[0]);

          setVcData(data[0].funding_rounds.map(function(el) {
            return Object.assign(el, {
              'fund': data[0].fund,
              'country': data[0].country
            });
          }));

          isLoading.current = false;

        }

    })()

  }, [props.logged_in, vcId])

  return (
    <Container>
      <GenericDataTable logged_in={props.logged_in} columns={columns} rows={vcData} />
    </Container>

    )
}