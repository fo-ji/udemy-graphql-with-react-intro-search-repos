import { useState, useRef } from 'react'
import { ApolloProvider, Query, Mutation } from 'react-apollo'

import client from './client'
import { ADD_STAR, REMOVE_STAR, SEARCH_REPOSITORIES } from './graphql'

const StarButton = (props) => {
  const { node, variables } = props
  const totalCount = node.stargazers.totalCount
  const viewerHasStarred = node.viewerHasStarred
  const starCount = totalCount === 1 ? '1 star' : `${totalCount} stars`

  const StarStatus = (props) => {
    const { addOrRemoveStar } = props

    return (
      <button
        onClick={() => {
          addOrRemoveStar({
            variables: { input: { starrableId: node.id } },

            // データをfetchせず、ブラウザで持っているキャッシュを更新する
            update: (store, { data: { addStar, removeStar } }) => {
              const { starrable } = addStar || removeStar
              console.log('starrable: ', { starrable })

              const data = store.readQuery({
                query: SEARCH_REPOSITORIES,
                variables: variables,
              })
              const edges = data.search.edges
              const newEdges = edges.map((edge) => {
                if (edge.node.id === node.id) {
                  const totalCount = edge.node.stargazers.totalCount
                  // const diff = viewerHasStarred ? 1 : -1
                  const diff = starrable.viewerHasStarred ? 1 : -1
                  const newTotalCount = totalCount + diff
                  edge.node.stargazers.totalCount = newTotalCount
                }
                return edge
              })
              data.search.edges = newEdges
              store.writeQuery({
                query: SEARCH_REPOSITORIES,
                data,
              })
            },
          })
        }}
      >
        {starCount} | {viewerHasStarred ? 'starred' : '-'}
      </button>
    )
  }

  return (
    <Mutation
      mutation={viewerHasStarred ? REMOVE_STAR : ADD_STAR}
      // データをfetchして、配列を指定するパターン
      // refetchQueries={[
      //   {
      //     query: SEARCH_REPOSITORIES,
      //     variables: variables,
      //   },
      // ]}

      // 関数も受け取れる
      // refetchQueries={(mutationResult) => {
      //   console.log({ mutationResult })
      //   return [
      //     {
      //       query: SEARCH_REPOSITORIES,
      //       variables: variables,
      //     },
      //   ]
      // }}
    >
      {(addOrRemoveStar) => {
        return <StarStatus addOrRemoveStar={addOrRemoveStar} />
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
  query: '',
}

function App() {
  const [variables, setVariables] = useState(INITIAL_VARIABLES)
  const myRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()

    setVariables((prevState) => {
      return { ...prevState, query: myRef.current.value }
    })
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
        <input ref={myRef} />
        <input type="submit" value="Submit" />
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
                      <StarButton node={node} variables={variables} />
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
