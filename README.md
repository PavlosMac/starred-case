# Starred application case

Welcome to the Starred application case. This case is part of the application process here at Starred as we believe that actions speak louder than words!

The case is based on two tasks: a coding task, and an architecture diagram task.

We're looking forward to seeing your solutions!

## Expectations

We trust that you know how to code, but we want to throw you into a situation similar to what you would do in this role. Use this task to show us **how** you write code, solve problems and most importantly, how you think.

We know your time is valuable, so we don't expect you to spend more than 2 hours on this task.

When we meet to discuss the case, we will ask you to present your solution in these regards:

- What did you implement
- How did you go about solving the task at hand
- What you prioritised
- What you would have done if you had more time
- Describe the architecture diagram you brought

## The coding task

Starred.com is a candidate-centric recruitment platform where candidates can find new opportunities, practice for interviews and track their recruitment progress. In this task you will build an primitive version of job searching and reporting about what jobs candidates search for.

See the next section for the description of a starting codebase and endpoint that you can use. However remember that it's there to get you started, so if you feel like doing it your own way simply go ahead. That includes completely disregarding the starter project and using any tech/framework you see as appropriate.

You'll be implementing functionality for the candidates. The bullet points are intended as user actions so it is up to you how far(or not) you want to go with each point. 

**Requirements for candidates**

- Candidates should be able to browse job opportunities which include job titles, descriptions and company names
- Candidates should be able to search by job title to narrow down the results
- Candidates should be able to "favourite" the jobs they found interesting. Favouriting a job should let users easily find it again
- (Nice to)Any other functionality that you think would help candidates find relevant opportunities

## Delivery of the project

Once you're done submit either a zip/rar file with your codebase (you might want to exclude `node_modules`) and your instructions to us for how to run it. Alternatively fork the repository and submit the link

### Starter project

The starter project has three components to it: a frontend, basic backend and an external endpoint. As mentioned before, this is intended to help you get started. _You can change any part of it or completely ignore this project and setup your own instead._

The provided components are:

- Nuxt.js v3/Tailwindcss frontend boilerplate with a couple of stylized components
- Express.js backend in the `./backend` folder which starts an HTTP server and connects to an SQLite database. By default it will start on port 3000 and will only have a single endpoint `/users` which will return a list of users from the database.
- An external service that provides endpoints to list jobs, get jobs by ID and to search for job IDs based on a job title. You should only communicate with this endpoint using `application/json` content type. It may return errors(for example in case of invalid query provided) in which case you will receive a response with a HTTP 4xx code and the body will contain an `error` attribute. The available endpoints are:
  - `GET https://yon9jygrt9.execute-api.eu-west-1.amazonaws.com/prod/jobs` - a paginated list of all available jobs. To query a particular page, include the `page=<number>` query parameter
  - `GET https://yon9jygrt9.execute-api.eu-west-1.amazonaws.com/prod/jobs/<number>` - a specific job. Replace the `<number>` in the path with the job ID retrieved from one of the other endpoints
  - `POST https://yon9jygrt9.execute-api.eu-west-1.amazonaws.com/prod/jobs/recommendations` - returns the recommended job IDs based on the query that should be specified as the JSON request payload in the form of `{"jobTitle": "<your-query-here>"}`.

#### Prerequisites

We tested this project with node version 20 and `npm` as the package manager, but others might work too.

#### Starting the project

2. Run `npm install`
3. Run `npm run db:reset` to reset & reseed the local SQLite database
4. Run `npm run server:start` `npm run server:dev` to start an expressjs server on localhost:3001
5. In a separate terminal window, run the Nuxt dev environment with `npm run client:dev`

## Architecture diagram task

While the coding task gives us the opportunity to have a discussion about your choices, we know you're probably used to working with bigger tasks. To avoid asking you to develop real features for us, instead we ask you to bring an architecture drawing of a solution you are proud of. This could be a side project you recently worked on or fictional system. Ideally something that is still fresh in your mind, so you don't have to spend hours creating it.

The contents and scope of the diagram are entirely up to you: if the solution contains too many moving parts you can keep it simple by outlining only the most important parts and then walking us through it later, alternatively if you enjoy creating diagrams, you can also cover every aspect of the solution.

We use various tools for diagrams internally such as FigJam, Google Slides and https://draw.io. You can use one of these or something you're more acustom to.
