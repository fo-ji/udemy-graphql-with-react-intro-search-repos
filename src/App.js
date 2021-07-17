import { useState } from 'react'
import { ApolloProvider } from 'react-apollo'
import { Query } from 'react-apollo'

import client from './client'
import { SEARCH_REPOSITORIES } from './graphql'

const PER_PAGE = 5
const INITIAL_VARIABLES = {
  first: PER_PAGE,
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

  const goNext = (search) => {
    setVariables((prevState) => {
      return { ...prevState, after: search.pageInfo.endCursor }
    })
  }

  const goPrevious = (search) => {
    setVariables((prevState) => {
      return {
        ...prevState,
        first: null,
        after: null,
        last: PER_PAGE,
        before: search.pageInfo.startCursor,
      }
    })
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

          const search = data.search
          const repositoryCount = search.repositoryCount
          const repositoryUnit =
            repositoryCount === 1 ? 'Repository' : 'Repositories'
          const title = `GitHub Repositories Search Results - ${repositoryCount} ${repositoryUnit}`

          return (
            <>
              <h2>{title}</h2>
              <ul>
                {search.edges.map((edge) => {
                  const node = edge.node

                  return (
                    <li key={node.id}>
                      <a href={node.url} target="_blank" rel="noreferrer">
                        {node.name}
                      </a>
                    </li>
                  )
                })}
              </ul>

              {search.pageInfo.hasPreviousPage === true && (
                <button onClick={() => goPrevious(search)}>Previous</button>
              )}

              {search.pageInfo.hasNextPage === true && (
                <button onClick={() => goNext(search)}>Next</button>
              )}
            </>
          )
        }}
      </Query>
    </ApolloProvider>
  )
}

export default App
