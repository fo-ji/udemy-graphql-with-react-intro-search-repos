import { useState } from 'react'
import { ApolloProvider, Query, Mutation } from 'react-apollo'

import client from './client'
import { ADD_STAR, SEARCH_REPOSITORIES } from './graphql'

const StarButton = (props) => {
  const { node } = props
  const totalCount = node.stargazers.totalCount
  const viewerHasStarred = node.viewerHasStarred
  const starCount = totalCount === 1 ? '1 star' : `${totalCount} stars`

  const StarStatus = (props) => {
    const { addStar } = props

    return (
      <button
        onClick={() => {
          addStar({
            variables: { input: { starrableId: node.id } },
          })
        }}
      >
        {starCount} | {viewerHasStarred ? 'starred' : '-'}
      </button>
    )
  }

  return (
    <Mutation mutation={ADD_STAR}>
      {(addStar) => {
        return <StarStatus addStar={addStar} />
      }}
    </Mutation>
  )
}

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
                      &nbsp;
                      <StarButton node={node} />
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
