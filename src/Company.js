// import { useState, useEffect, useRef } from "react";
import DataTable from './DataTable';
import { supabase } from './supabaseClient'
import Container from '@mui/material/Container';
import { Link, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ApexCharts from 'apexcharts';

export default function Company(props) {
  let { companyId } = useParams();

  const [companyData, setCompanyData] = useState(null);
  const loggedIn = useRef(-1);
  const isLoading = useRef(false);

  useEffect(() => {

    loggedIn.current = props.logged_in;
    // console.log(loggedIn.current);

    if (loggedIn.current == -1) {
      console.log('Company.js has not yet loaded login info');
      return;
    }

    if (isLoading.current) {
      console.log('Company.js already in process of loading company and jobs data, so do not call the API again');
      return;
    }

    isLoading.current = true;

    (async() => {

      var data, error;
      ({data, error} = await supabase.from('companies')
        .select(`
          id,
          company,
          tags,
          linkedin,
          glassdoor,
          clearbit_logo,
          clearbit_domain,
          linkedin_jobs(
            id,
            employees,
            job_openings,
            timestamp
          )
        `).eq('id', companyId).order('timestamp', {foreignTable: 'linkedin_jobs', ascending: false }))
      console.log('We have just made 1 API call');

      if (error)
        console.log('Error occurred:', error)
      else
        if (JSON.stringify(data[0]) != JSON.stringify(companyData)) {
          console.log('Company.js has loaded this: ');
          console.log(data[0]);
          isLoading.current = false;
          setCompanyData(data[0]);

          var sorted_data = [...data[0].linkedin_jobs].sort((a, b) => { return a.timestamp - b.timestamp } )
          var options = {
            chart: {
              type: 'line',
              height: 400
            },
            series: [
              {
                name: 'Employees',
                data: sorted_data.map(x => x.employees)
              },
              {
                name: 'Job Openings',
                data: sorted_data.map(x => x.job_openings)
              }
            ],
            xaxis: {
              categories: sorted_data.map(x => new Date(x.timestamp * 1000).toLocaleDateString("en-US")),
              hideOverlappingLabels: true
            },
            yaxis: [
              {
                title: {
                  text: 'Employees'
                },
                labels: {
                  formatter: function(val, index) {
                    return val.toLocaleString();
                  }
                },
                forceNiceScale: true,
                min: Math.min(...sorted_data.map(x => x.employees))
              },
              {
                opposite: true,
                title: {
                  text: 'Job Openings'
                },
                labels: {
                  formatter: function(val, index) {
                    return val.toLocaleString();
                  }
                },
                forceNiceScale: true,
                min: Math.min(...sorted_data.map(x => x.job_openings))
              }
            ],
            stroke: {
              width: 2,
              curve: 'smooth'
            }
          }
          var chart = new ApexCharts(document.querySelector("#chart"), options);
          chart.render();

        }

    })()

  }, [props.logged_in, companyId])

  return (
    <>
      <Container>
        {
          companyData != null && companyData.clearbit_logo != null ?
          (companyData.clearbit_domain != null ? (<a href={'https://' + companyData.clearbit_domain} target="_blank"><img src={companyData.clearbit_logo} height="50" /></a>) : (<img src={companyData.clearbit_logo} height="50" />)
          )
          :
          ""
        }
        <h3>{companyData != null ? companyData.company : ''}</h3>
        {
          companyData != null && companyData.linkedin != null ?
          (<a href={companyData.linkedin} target="_blank"><img src={process.env.PUBLIC_URL + '/linkedin.png'} height="21" /></a>)
          :
          ""
        }
        {
          companyData != null && companyData.glassdoor != null ?
          (<a href={companyData.glassdoor} target="_blank"><img src={process.env.PUBLIC_URL + '/glassdoor.png'} height="21" /></a>)
          :
          ""
        }
        <div id='chart'></div>
      </Container>
      <Container>
        <DataTable logged_in={props.logged_in} company_id={companyId} company_data={companyData} />
      </Container>
    </>
    )
}