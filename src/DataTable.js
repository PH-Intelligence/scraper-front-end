import * as React from 'react';
import { useState, useEffect } from "react";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { supabase } from './supabaseClient'

const columns = [
  // { field: 'id', headerName: 'ID' },
  { field: 'Timestamp', headerName: 'Date & Time', valueFormatter: (params) => { return new Date(params.value * 1000).toLocaleString() }, flex: 1 },
  { field: 'Companies_Company', headerName: 'Company', valueGetter: (params) => { return params.row.Companies.Company }, flex: 1},
  { field: 'Employees', headerName: 'Employees', valueFormatter: (params: GridValueFormatterParams<number>) => {
              if (params.value == null) {
                return '';
              }
              return params.value.toLocaleString();
            } },
  { field: 'Job Openings', headerName: 'Job Openings', valueFormatter: (params: GridValueFormatterParams<number>) => {
              if (params.value == null) {
                return '';
              }
              return params.value.toLocaleString();
            } },
  { field: 'Companies_Tags', 
    headerName: 'Company Categories',
    width: 300,
    valueGetter: (params) => {return params.row.Companies.Tags},
    valueFormatter: ({value}) => value,
    renderCell: (params: GridRenderCellParams<String>) => (
          params.row.Companies.Tags ? params.row.Companies.Tags.split(",").map(x => <React.Fragment key={x}><span style={{backgroundColor: '#398a7c', borderRadius: '10px', padding: '0px 5px'}}>{x}</span>&nbsp;</React.Fragment>) : ''
    )
  }
]

export default function DataTable(props) {

  const [tableData, setTableData] = useState([]);

  useEffect(() => {

    console.log("hey");

    (async() => {
      
      const { data, error } = await supabase.from('LinkedIn Jobs')
        .select(`
          id,
          Employees,
          "Job Openings",
          Timestamp,
          Companies (
            Company,
            Tags
          )
        `)
        if (error)
          console.log('Error occurred:', error)
        else
          if (JSON.stringify(data.sort((a, b) => a.Companies.Company.localeCompare(b.Companies.Company))) != JSON.stringify(tableData)) {
            var from_existing_data = tableData.length > 0 ? tableData[0]['Companies'] : '';
            var from_supabase = data.sort((a, b) => a.Companies.Company.localeCompare(b.Companies.Company))[0]['Companies'];
            console.log('changing');
            setTableData(data.sort((a, b) => a.Companies.Company.localeCompare(b.Companies.Company)))
          }
      })()

  }, [ tableData, props.logged_in])

  return (
    <div style={{ height: 600, display: 'flex' }}>
      <DataGrid
        rows={tableData}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10,25,100]}
        components={props.logged_in ? {Toolbar: GridToolbar}: {}}
      />
    </div>
  );
}