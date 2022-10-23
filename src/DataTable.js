import * as React from 'react';
import { useState, useEffect, useRef } from "react";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { supabase } from './supabaseClient'
import { Link } from "react-router-dom";

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
    headerName: 'Company Categories',
    width: 300,
    valueGetter: (params) => {return params.row.companies.tags},
    valueFormatter: ({value}) => value,
    renderCell: (params: GridRenderCellParams<String>) => (
          params.row.companies.tags ? params.row.companies.tags.split(",").map(x => <React.Fragment key={x}><span style={{backgroundColor: '#398a7c', borderRadius: '10px', padding: '0px 5px'}}>{x}</span>&nbsp;</React.Fragment>) : ''
    )
  }
]

export default function DataTable(props) {

  const [tableData, setTableData] = useState([]);
  const loggedIn = useRef(-1);
  const companyId = useRef(-1);
  const isLoading = useRef(false);
  const companyData = useRef(-1);

  useEffect(() => {

    loggedIn.current = props.logged_in;
    companyId.current = props.company_id;

    // console.log(`useEffect has been triggered.\nprops.company_id == ${props.company_id} and companyId == ${companyId.current} (meaning they are equal: ${props.company_id == companyId.current})\nprops.logged_in == ${props.logged_in} and loggedIn == ${loggedIn.current} (meaning they are equal: ${props.logged_in == loggedIn.current})\nisLoading == ${isLoading.current}`)

    if (loggedIn.current == -1) {
      console.log('Logged in info has not loaded yet');
      return;
    } else if (companyId.current == -1 && 'company_id' in props) {
      console.log('Company ID info has not loaded yet');
      return;
    } else if (companyId.current != -1 && 'company_id' in props && (props.company_data == null || companyData.current != -1)) {
      console.log('Company data info has not loaded yet');
      return;
    }

    if (isLoading.current) {
      console.log('DataTable.js is already in process of loading the data table, so do not call the API again');
      return;
    }

    console.log('something has changed');

    isLoading.current = true;

    (async() => {

      // console.log('Async portion starting');

      var data, error;

      if (props.company_id) {
        if (props.company_data) {
          data = props.company_data.linkedin_jobs.map(function(el) {
            return Object.assign(el, {'companies': {
              'id': props.company_data.id,
              'company': props.company_data.company,
              'tags': props.company_data.tags
            }});
          });
          companyData.current = data;
        } else {
          data = [];
        }
      } else {
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
      }

      if (error)
        console.log('Error occurred:', error)
      else
        isLoading.current = false;
        if (JSON.stringify(data) != JSON.stringify(tableData)) {
          setTableData(data);
          console.log(data);
        } else {
          // console.log('The table data is identical to the last one, so do not reset it')
        }

      })()

  }, [props.logged_in, props.company_id, props.company_data])

  // console.log('Render commencing...');
  return (
    <div style={{ height: 600, display: 'flex' }}>
      <DataGrid
        rows={tableData}
        columns={columns}
        rowsPerPageOptions={[10,25,100]}
        initialState={{
          pagination: {
            pageSize: 25
          },
        }}
        components={props.logged_in ? {Toolbar: GridToolbar}: {}}
      />
    </div>
  );
}