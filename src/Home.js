import * as React from 'react';
import { useState, useEffect, useRef } from "react";
import { supabase } from './supabaseClient';
import GenericDataTable from './GenericDataTable';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Copyright from './Copyright';
import Auth from './Auth'
import Account from './Account'
import { Link } from "react-router-dom";

export default function Home(props) {

  const columns = [
    // { field: 'id', headerName: 'ID' },
    { field: 'timestamp', headerName: 'Date & Time', valueFormatter: (params) => { return new Date(params.value * 1000).toLocaleString(undefined, {year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric"}) }, flex: 0.75 }, // https://stackoverflow.com/a/34015511/3593246
    { field: 'companies_company', headerName: 'Company', valueGetter: (params) => { return params.row.companies.company }, renderCell: (
      params: GridRenderCellParams<String>) => (params.row.companies.clearbit_logo != null ? (<Link to={`/companies/${params.row.companies.id}`}><img src={params.row.companies.clearbit_logo} height="25" title={params.row.companies.company} /></Link>) : (<Link to={`/companies/${params.row.companies.id}`}>{params.row.companies.company}</Link>)
      ), flex: 1},
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
              }, flex: 0.5 },
    { field: 'companies_tags', 
      headerName: 'Categories',
      width: 300,
      valueGetter: (params) => {return params.row.companies.tags},
      valueFormatter: ({value}) => value,
      renderCell: (params: GridRenderCellParams<String>) => (
            params.row.companies.tags ? params.row.companies.tags.split(",").map(x => <React.Fragment key={x}><span style={{backgroundColor: '#add4ce', borderRadius: '10px', padding: '0px 5px'}}>{x}</span>&nbsp;</React.Fragment>) : ''
      )
    }
  ]

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

      ({data, error} = await supabase.from('linkedin_jobs')
      .select(`
        id,
        employees,
        job_openings,
        timestamp,
        companies (
          id,
          company,
          tags,
          clearbit_logo
        )
      `).order('date_and_time', { ascending: false }))
      console.log('We have just made 1 DB call');


      if (error)
        console.log('Error occurred:', error)
      else
        isLoading.current = false;
        if (JSON.stringify(data) != JSON.stringify(companyData)) {
          setCompanyData(data);
          console.log(data);
        } else {
          // console.log('The table data is identical to the last one, so do not reset it')
        }

      })()

  }, [props.logged_in])

  return (
    <>
      <Container maxWidth="md">
        {!props.logged_in ? (
          <Auth />
        ) : (
          <Account key={props.logged_in.user.id} session={props.logged_in} />
        )}
      </Container>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Company Tracker
          </Typography>
          <GenericDataTable logged_in={props.logged_in} columns={columns} rows={companyData} />
          <Copyright />
        </Box>
      </Container>
    </>
  )

}