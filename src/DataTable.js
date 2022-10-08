import * as React from 'react';
import { useState, useEffect } from "react";
import { DataGrid } from '@mui/x-data-grid';
import { createClient } from '@supabase/supabase-js'

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
    renderCell: (params: GridRenderCellParams<String>) => (
          params.row.Companies.Tags ? params.row.Companies.Tags.split(",").map(x => <React.Fragment key={x}><span style={{backgroundColor: '#c8f7ef'}}>{x}</span>&nbsp;</React.Fragment>) : ''
    )
  }
]

export default function DataTable(props) {

  const [tableData, setTableData] = useState([]);

  useEffect(() => {

    (async() => {
      // your code using await goes here
      const supabase = createClient(
        'https://abhxwgvatqovevkjxlyy.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaHh3Z3ZhdHFvdmV2a2p4bHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjUwMDI1MTcsImV4cCI6MTk4MDU3ODUxN30.81UKLfbdZqsPco1SC8vi2nf6wJNWbCbn6Yv5Tkn_B-0'
      )

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
        setTableData(data.sort((a, b) => a.Companies.Company.localeCompare(b.Companies.Company)))
    })()

  }, [])

  return (
    <div style={{ height: 600, display: 'flex' }}>
      <DataGrid
       rows={tableData}
       columns={columns}
       pageSize={12}
     />
    </div>
  );
}