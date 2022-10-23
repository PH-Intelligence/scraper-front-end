import { useState, useEffect, useRef } from "react";
import DataTable from './DataTable';
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

export default function CompanyIndex(props) {

  const [companyData, setCompanyData] = useState([]);
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
          tags,
          linkedin_jobs(employees, job_openings)
        `)
        .order('company', { ascending: true })
        .order('date_and_time', {foreignTable: 'linkedin_jobs', ascending: false})
        .limit(1, {foreignTable: 'linkedin_jobs'})
      )
      // console.log('We have just made 1 API call');

      if (error)
        console.log('Error occurred:', error)
      else
        if (JSON.stringify(data) != JSON.stringify(companyData)) {
          // console.log('changing');
          isLoading.current = false;
          setCompanyData(data);
        }

    })()

  }, [props.logged_in])

  const reSort = sort_method => {
    // console.log(companyData);
    setCompanyData([...companyData].sort((a, b) => {

      // We need these lines because, when we add a brand-new company that doesn't yet have any employees or job openings data, the sorting would throw an error unless we set their employees/openings numbers to 0
      var a_employees_and_jobs = a.linkedin_jobs.length > 0 ? [a.linkedin_jobs[0].employees, a.linkedin_jobs[0].job_openings] : [0,0]
      var b_employees_and_jobs = b.linkedin_jobs.length > 0 ? [b.linkedin_jobs[0].employees, b.linkedin_jobs[0].job_openings] : [0,0]

      if (sort_method == 'alphabetical') {
        return a.company.localeCompare(b.company);
      } else if (sort_method == 'employees') {
        return b_employees_and_jobs[0] - a_employees_and_jobs[0];
      } else if (sort_method == 'openings') {
        return b_employees_and_jobs[1] - a_employees_and_jobs[1];
      }

    }));
  };


  return (
  <>
    <h3>Please select a company.</h3>
    <div>
      Sort by:&nbsp;
      <button onClick={() => reSort('alphabetical')}>Company name</button>&nbsp;
      <button onClick={() => reSort('employees')}>Current employee count</button>&nbsp;
      <button onClick={() => reSort('openings')}>Current job opening count</button>
    </div>
    <ul>
      {companyData.map((company) => (
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