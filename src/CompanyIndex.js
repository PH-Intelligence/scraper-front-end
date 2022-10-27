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

export default function CompanyIndex(props) {

  const [companyData, setCompanyData] = useState([]);
  const [tagsData, setTagsData] = useState([]);
  const [selectedTagsData, setSelectedTagsData] = useState([]);
  const [filteredCompanyData, setFilteredCompanyData] = useState([]);
  const loggedIn = useRef(-1);
  const isLoading = useRef(false);

  useEffect(() => {

    loggedIn.current = props.logged_in;
    // console.log(loggedIn.current);

    if (loggedIn.current == -1) {
      // console.log('has not yet loaded');
      return;
    }

    if (isLoading.current) {
      // console.log('already in process of loading, so do not call the API again');
      return;
    }

    isLoading.current = true;

    (async() => {

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
      // console.log('We have just made 1 API call');

      if (error)
        console.log('Error occurred:', error)
      else
        if (JSON.stringify(data) != JSON.stringify(companyData)) {
          // console.log('changing');
          isLoading.current = false;
          setCompanyData(data);
          setFilteredCompanyData(data);
          var tags_array = [...new Set([].concat(...data.map(x => x.tags_array)))].sort((a,b) => { return a.localeCompare(b); }); // Taken from https://stackoverflow.com/a/51315034/3593246
          setTagsData(tags_array);
          setSelectedTagsData(tags_array);
        }

    })()

  }, [props.logged_in])

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
      return;
    } else if (tag == -2) {
      setSelectedTagsData([]);
      setFilteredCompanyData([]);
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
      if (company.tags_array.filter(x => new_selected_tags.includes(x)).length > 0) {
        new_filtered_companies.push(company);
      }
    });
    setFilteredCompanyData(new_filtered_companies);
  };

  return (
    <>
      <h3>Please select a company.</h3>
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
      <ul>
        {filteredCompanyData.map((company) => (
          <li key={company.id}>
            <Link to={`/companies/${company.id}`}>
              {company.company}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}