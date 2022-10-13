import * as React from 'react';
import { useState, useEffect, useRef } from "react";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { supabase } from './supabaseClient'
import { Link } from "react-router-dom";

const columns = [
  // { field: 'id', headerName: 'ID' },
  { field: 'timestamp', headerName: 'Date & Time', valueFormatter: (params) => { return new Date(params.value * 1000).toLocaleString(undefined, {year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric"}) }, flex: 0.75 }, // https://stackoverflow.com/a/34015511/3593246
  { field: 'companies_company', headerName: 'Company', valueGetter: (params) => { return params.row.companies.company }, renderCell: (
    params: GridRenderCellParams<String>) => (<Link to={`/companies/${params.row.companies.id}`}>{params.row.companies.company}</Link>
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

  useEffect(() => {

    loggedIn.current = props.logged_in;
    companyId.current = props.company_id;

    // console.log(`useEffect has been triggered.\nprops.company_id == ${props.company_id} and companyId == ${companyId.current} (meaning they are equal: ${props.company_id == companyId.current})\nprops.logged_in == ${props.logged_in} and loggedIn == ${loggedIn.current} (meaning they are equal: ${props.logged_in == loggedIn.current})\nisLoading == ${isLoading.current}`)

    if (loggedIn.current == -1 || companyId.current == -1) {
      // console.log('has not yet loaded');
      return;
    }

    if (isLoading.current) {
      // console.log('already in process of loading, so do not call the API again');
      return;
    }

    isLoading.current = true;

    (async() => {

      // console.log('Async portion starting');

      var data, error;

      if (props.company_id) {
        ({data, error} = await supabase.from('linkedin_jobs')
        .select(`
          id,
          employees,
          "job_openings",
          timestamp,
          companies (
            id,
            company,
            tags
          )
        `).eq('company_id', props.company_id).order('id', { ascending: false }))
      } else {
        ({data, error} = await supabase.from('linkedin_jobs')
        .select(`
          id,
          employees,
          "job_openings",
          timestamp,
          companies (
            id,
            company,
            tags
          )
        `).order('date_and_time', { ascending: false }))
      }

      // console.log('We have just made 1 DB call')

      if (error)
        console.log('Error occurred:', error)
      else
        if (JSON.stringify(data) != JSON.stringify(tableData)) {
          isLoading.current = false;
          setTableData(data);
        } else {
          // console.log('The table data is identical to the last one, so do not reset it')
        }

      })()

  }, [props.logged_in, props.company_id])

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