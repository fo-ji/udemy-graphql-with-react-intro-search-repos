import { useState } from 'react'
import { ApolloProvider } from 'react-apollo'
import { Query } from 'react-apollo'

import client from './client'
import { SEARCH_REPOSITORIES } from './graphql'

const INITIAL_VARIABLES = {
  first: 5,
  after: null,
  last: null,
  before: null,
  query: 'フロントエンドエンジニア',
}

function App() {
  const [variables, setVariables] = useState(INITIAL_VARIABLES)

  const handleChange = (e) => {
    setVariables({
      ...INITIAL_VARIABLES,
      query: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
  }

  return (
    <ApolloProvider client={client}>
      <form onSubmit={handleSubmit}>
        <input value={variables.query} onChange={handleChange} />
      </form>
      <Query query={SEARCH_REPOSITORIES} variables={variables}>
        {({ loading, error, data }) => {
          if (loading) return 'Loading...'
          if (error) return `Error! ${error.message}`

          console.log('data: ', { data })
          return <div></div>
        }}
      </Query>
    </ApolloProvider>
  )
}

export default App
