import { useState, useEffect, useRef } from "react";
import GenericDataTable from './GenericDataTable';
import { supabase } from './supabaseClient';
import Container from '@mui/material/Container';
import { Link, useParams } from "react-router-dom";
import { findFlagFromCountry } from './country_flags.js'

export default function VC_Fund(props) {

  let { vcId } = useParams();

  const [vcData, setVcData] = useState([]);
  const loggedIn = useRef(-1);
  const isLoading = useRef(false);

  const columns = [
    { field: 'earliest_pub_date', headerName: 'Date', valueFormatter: (params) => { return new Date(params.value).toLocaleString(undefined, {year: "numeric", month: "numeric", day: "numeric"}) }, flex: 0.5 }, // https://stackoverflow.com/a/34015511/3593246
    { field: 'company', headerName: 'Company', valueGetter: (params) => { return `${findFlagFromCountry(params.row.location ? params.row.location : '')} ${params.row.company}` }, flex: 0.5 },
    { field: 'usd_normalized', headerName: 'Total Round Amount (US$)', valueFormatter: (params: GridValueFormatterParams<number>) => {
              if (params.value == null) {
                return '';
              }
              return '$' + Math.round(params.value).toLocaleString();
            }, type: 'number', flex: 0.5 },
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
          clearbit_logo,
          clearbit_domain,
          funding_rounds (
            id,
            company,
            funding_amount,
            currency,
            usd_normalized,
            funding_round,
            location,
            earliest_pub_date
          )
        `).eq('id', vcId).order('earliest_pub_date', {foreignTable: 'funding_rounds', ascending: false }))
      console.log('We have just made 1 API call');

      if (error)
        console.log('Error occurred:', error)
      else
        if (JSON.stringify(data[0]) != JSON.stringify(vcData)) {
          console.log('VC_Fund.js has loaded this: ');
          console.log(data[0]);

          setVcData(data[0]);

          isLoading.current = false;

        }

    })()

  }, [props.logged_in, vcId])

  return (
    <>
      <Container>
        {
          vcData != null && vcData.clearbit_logo != null ?
          (vcData.clearbit_domain != null ? (<a href={'https://' + vcData.clearbit_domain} target="_blank"><img src={vcData.clearbit_logo} height="50" /></a>) : (<img src={vcData.clearbit_logo} height="50" />)
          )
          :
          ""
        }
        <h3 style={{marginBottom: '3px'}}>{vcData != null ? vcData.fund : ''}</h3>
        <div style={{marginBottom: '15px'}}>
          { vcData.country ? findFlagFromCountry(vcData.country) : '' }
        </div>
      </Container>
      <Container>
        <GenericDataTable logged_in={props.logged_in} columns={columns} rows={ vcData ? vcData.funding_rounds : [] } />
      </Container>
    </>
    )
}