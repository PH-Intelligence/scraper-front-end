import * as React from 'react';
import { useState, useEffect } from "react";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { supabase } from './supabaseClient'
import { Link } from "react-router-dom";

const columns = [
  // { field: 'id', headerName: 'ID' },
  { field: 'timestamp', headerName: 'Date & Time', valueFormatter: (params) => { return new Date(params.value * 1000).toLocaleString() }, flex: 0.5 },
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
  const [initiallyLoaded, setInitiallyLoaded] = useState(false);
  const [companyId, setCompanyId] = useState(props.company_id);
  const [loggedIn, setLoggedIn] = useState(props.logged_in);

  useEffect(() => {

    if (initiallyLoaded && props.company_id == companyId && props.logged_in == loggedIn) {
      console.log('already loaded');
      return;
    }

    (async() => {

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
        console.log(data)
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
        console.log(data)
      }

      if (error)
        console.log('Error occurred:', error)
      else
        console.log('made a check');
        if (JSON.stringify(data) != JSON.stringify(tableData)) {
          // var from_existing_data = tableData.length > 0 ? tableData[0]['companies'] : '';
          // var from_supabase = data.sort((a, b) => a.companies.company.localeCompare(b.companies.company))[0]['companies'];
          console.log(data);
          setInitiallyLoaded(true);
          setCompanyId(props.company_id);
          setLoggedIn(props.logged_in);
          setTableData(data)
        }

      })()

  }, [ tableData, props.logged_in, props.company_id])

  console.log('ok');
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