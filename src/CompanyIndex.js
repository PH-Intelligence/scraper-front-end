import { useState, useEffect } from "react";
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

export function Company(props) {
  let { companyId } = useParams();
  console.log(companyId);
  return (
    <Container>
      <h3>Requested company ID: {companyId}</h3>
      <DataTable logged_in={props.logged_in} company_id={companyId} />
    </Container>
    )
}

export function CompanyIndex(props) {

  const [companyData, setCompanyData] = useState([]);
  const [initiallyLoaded, setInitiallyLoaded] = useState(false);

  useEffect(() => {

    if (initiallyLoaded) {
      console.log('already loaded');
      return;
    }

    (async() => {

      var data, error;

      ({data, error} = await supabase.from('companies')
      .select(`
        id,
        company,
        tags
      `).order('company', { ascending: true }))
      console.log(data)

      if (error)
        console.log('Error occurred:', error)
      else
        if (JSON.stringify(data) != JSON.stringify(companyData)) {
          console.log('changing');
          setInitiallyLoaded(true);
          setCompanyData(data);
        }

    })()

  }, [ companyData, props.logged_in, props.company_id])

  return (
  <>
    <h3>Please select a company.</h3>
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