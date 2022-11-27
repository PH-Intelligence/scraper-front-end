import * as React from 'react';
import { useState, useEffect, useRef } from "react";
import Container from '@mui/material/Container';
import { supabase } from './supabaseClient';
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  Outlet,
  useMatch,
  useParams
} from "react-router-dom";
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import ApexCharts from 'apexcharts';

export default function CompanyIndex(props) {

  const [companyData, setCompanyData] = useState([]);
  const [tagsData, setTagsData] = useState([]);
  const [selectedTagsData, setSelectedTagsData] = useState([]);
  const [filteredCompanyData, setFilteredCompanyData] = useState(-1);
  const loggedIn = useRef(-1);
  const inProgressLoading = useRef(-1);
  const filterChanged = useRef(-1);

  useEffect(() => {

    // console.log('Triggered useEffect');
    // console.log(filterChanged);

    loggedIn.current = props.logged_in;
    // console.log(loggedIn.current);

    if (loggedIn.current == -1) {
      // console.log('has not yet loaded');
      return;
    }

    if (filterChanged.current == false && inProgressLoading.current != -1) {
      // console.log('skipping because we loaded, or are currently loading, and there is no filter change');
      return;
    }

    (async() => {

      if (inProgressLoading.current == -1) {

        inProgressLoading.current = true;

        var data, error;

        (
          {data, error} = await supabase.from('companies')
          .select(`
            id,
            company,
            tags_array,
            linkedin_jobs(employees, job_openings)
          `)
          .order('company', { ascending: true })
          .order('date_and_time', {foreignTable: 'linkedin_jobs', ascending: false})
          .limit(7, {foreignTable: 'linkedin_jobs'})
        )
        console.log('We have just made 1 API call for the company and tags list');

        if (error)
          console.log('Error occurred:', error)
        else
          console.log(data);
          if (JSON.stringify(data) != JSON.stringify(companyData)) {
            // console.log('changing');
            inProgressLoading.current = false;
            setCompanyData(data);
            setFilteredCompanyData(data);
            var tags_array = [...new Set([].concat(...data.map(x => x.tags_array).filter(x => x != null )))].sort((a,b) => { return a.localeCompare(b); }); // Taken from https://stackoverflow.com/a/51315034/3593246
            setTagsData(tags_array);
            setSelectedTagsData(tags_array);
            filterChanged.current = true;
          }

      }

      if (filterChanged.current != false && filteredCompanyData != -1) {

        filterChanged.current = false;

        // console.log('did we make it this far');
        // console.log(filteredCompanyData);

        var data, error;
        const groupBy = (x,f) => x.reduce((a,b,i)=>((a[f(b,i,x)]||=[]).push(b),a),{});
        // console.log((new Date() - 3000).toDateString());
        (
          {data, error} = await supabase.from('daily_counts')
          .select(`
            id,
            jobs_date,
            employees,
            job_openings
          `)
          .in('id', filteredCompanyData.map(x => x.id))
          .gte('jobs_date', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]) // Combo of https://stackoverflow.com/a/8842786/3593246 and https://stackoverflow.com/a/29774197/3593246
        )
        console.log('We have just made 1 API call for daily_counts');

        if (error)
          console.log('Error occurred:', error)
        else
          // console.log(data);
          var modified_data = groupBy(data, x => x.jobs_date);
          // console.log(modified_data);
          var new_modified_data = [];
          for (const [k, v] of Object.entries(modified_data)) {

            const sumWithInitial = v.reduce(
              (previousValue, currentValue) => previousValue + currentValue.employees,
              0
            );

            const sumWithInitial2 = v.reduce(
              (previousValue, currentValue) => previousValue + currentValue.job_openings,
              0
            );

            new_modified_data.push({"jobs_date": k, "employees": sumWithInitial, "job_openings": sumWithInitial2});
          }

          // console.log(new_modified_data);
          var options = {
            chart: {
              type: 'line',
              height: 300
            },
            series: [
              {
                name: 'Employees',
                data: new_modified_data.map(x => x.employees)
              },
              {
                name: 'Job Openings',
                data: new_modified_data.map(x => x.job_openings)
              }
            ],
            xaxis: {
              categories: new_modified_data.map(x => x.jobs_date),
              type: 'datetime'
            },
            yaxis: [
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
                min: Math.min(...new_modified_data.map(x => x.employees))
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
                min: Math.min(...new_modified_data.map(x => x.job_openings))
              }
            ],
            stroke: {
              width: 2,
              curve: 'smooth'
            },
            tooltip: {
              shared: true,
              theme: 'dark'
            }
          };

          document.getElementById('chart').innerHTML = '';
          // console.log('rendering chart');
          // console.log(options);
          var chart = new ApexCharts(document.querySelector("#chart"), options);
          chart.render();

      }

    })();


  }, [props.logged_in, filterChanged.current, filteredCompanyData])

  const reSort = sort_method => {
    // console.log(companyData);
    setFilteredCompanyData([...filteredCompanyData].sort((a, b) => {

      // We need these lines because, when we add a brand-new company that doesn't yet have any employees or job openings data, the sorting would throw an error unless we set their employees/openings numbers to 0
      var a_employees_and_jobs = a.linkedin_jobs.length > 0 ? [a.linkedin_jobs[0].employees, a.linkedin_jobs[0].job_openings] : [0,0]
      var b_employees_and_jobs = b.linkedin_jobs.length > 0 ? [b.linkedin_jobs[0].employees, b.linkedin_jobs[0].job_openings] : [0,0]

      var a_employees_and_jobs_delta = a.linkedin_jobs.length > 1 ? [Math.max(...a.linkedin_jobs.map(x => x.employees)) - Math.min(...a.linkedin_jobs.map(x => x.employees)), Math.max(...a.linkedin_jobs.map(x => x.job_openings)) - Math.min(...a.linkedin_jobs.map(x => x.job_openings))] : [0,0]
      var b_employees_and_jobs_delta = b.linkedin_jobs.length > 1 ? [Math.max(...b.linkedin_jobs.map(x => x.employees)) - Math.min(...b.linkedin_jobs.map(x => x.employees)), Math.max(...b.linkedin_jobs.map(x => x.job_openings)) - Math.min(...b.linkedin_jobs.map(x => x.job_openings))] : [0,0]

      if (sort_method == 'alphabetical') {
        return a.company.localeCompare(b.company);
      } else if (sort_method == 'employees') {
        return b_employees_and_jobs[0] - a_employees_and_jobs[0];
      } else if (sort_method == 'openings') {
        return b_employees_and_jobs[1] - a_employees_and_jobs[1];
      } else if (sort_method == 'employee_mover') {
        return b_employees_and_jobs_delta[0] - a_employees_and_jobs_delta[0];
      } else if (sort_method == 'job_mover') {
        return b_employees_and_jobs_delta[1] - a_employees_and_jobs_delta[1];
      }

    }));
  };

  const handleClick = (tag) => {

    if (tag == -1) {
      setSelectedTagsData(tagsData);
      setFilteredCompanyData(companyData);
      filterChanged.current = true;
      return;
    } else if (tag == -2) {
      setSelectedTagsData([]);
      setFilteredCompanyData([]);
      filterChanged.current = true;
      return;
    }

    var new_selected_tags;
    if (selectedTagsData.includes(tag)) {
      new_selected_tags = selectedTagsData.filter(x => x != tag);
    } else {
      new_selected_tags = selectedTagsData.concat([tag]);
    }
    setSelectedTagsData(new_selected_tags);

    var new_filtered_companies = [];
    companyData.forEach(company => {
      if (company.tags_array && company.tags_array.filter(x => new_selected_tags.includes(x)).length > 0) {
        new_filtered_companies.push(company);
      }
    });
    setFilteredCompanyData(new_filtered_companies);
    // console.log(`filterChanged is currently ${filterChanged}, now setting it to True`);
    filterChanged.current = true;
  };

  return (
    <>
      <Grid container rowSpacing={1} columnSpacing={1} style={{marginTop: '15px'}}>
        <Grid item>
          Sort by:
        </Grid>
        <Grid item>
          <button onClick={() => reSort('alphabetical')}>Company name</button>
        </Grid>
        <Grid item>
          <button onClick={() => reSort('employees')}>Current employee count</button>
        </Grid>
        <Grid item>
          <button onClick={() => reSort('openings')}>Current job opening count</button>
        </Grid>
        <Grid item>
          <button onClick={() => reSort('employee_mover')}>Recent employee delta</button>
        </Grid>
        <Grid item>
          <button onClick={() => reSort('job_mover')}>Recent job opening delta</button>
        </Grid>
      </Grid>
      <Grid container rowSpacing={1} columnSpacing={1} style={{marginTop: '15px'}}>
        Filter tags:&nbsp;
        <button onClick={() => handleClick(-1)}>Select all</button>&nbsp;
        <button onClick={() => handleClick(-2)}>Select none</button>&nbsp;
      </Grid>
      <Grid container rowSpacing={1} columnSpacing={1} style={{marginTop: '15px'}}>
        {tagsData.map((tag) => (
          selectedTagsData.indexOf(tag) != -1 ?
          (<Grid item key={tag}>
            <Chip label={tag} color="primary" size="small" onClick={() => handleClick(tag)} clickable variant="filled" />
          </Grid>)
          :
          (<Grid item key={tag}>
            <Chip label={tag} color="primary" size="small" onClick={() => handleClick(tag)} clickable variant="outlined" />
          </Grid>)
        ))}
      </Grid>
      <h3>Aggregate Employees & Job Openings</h3>
      <div id="chart"></div>
      <ul>
        {filteredCompanyData != -1 ? filteredCompanyData.map((company) => (
          <li key={company.id}>
            <Link to={`/companies/${company.id}`}>
              {company.company}
            </Link>
          </li>
        )) : []}
      </ul>
      <div id="explainer">
        <h5>Methodology</h5>
        <small>The <strong>Aggregate Employeees & Job Openings</strong> chart displays the total count of employees and job openings over the past 30 days for the companies with the selected tags. For any given date, if a company's employee and/or job opening data was not collected, the chart uses the counts from the nearest date of collection. Note that, for companies added to the data collection later on, this may result in implied counts for a given date that in reality were collected at a much later date. You can always view the precise collection dates by clicking on any company name to view their data.</small>
      </div>
    </>
  )
}