import * as React from 'react';
import { useState, useEffect } from "react";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Link } from "react-router-dom";

export default function GenericDataTable(props) {

  const [tableData, setTableData] = useState([]);

  useEffect(() => {

    if (props.rows != null && JSON.stringify(tableData) != JSON.stringify(props.rows)) {
      setTableData(props.rows);
    }

  }, [props.logged_in, props.columns, props.rows])

  // console.log('Render commencing...');
  return (
    <div style={{ height: 600, display: 'flex' }}>
      <DataGrid
        rows={tableData}
        columns={props.columns}
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