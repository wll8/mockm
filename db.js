const {mock} = require('mockjs')

module.exports = () => {
  const data = mock({
    'books|11-31': [
      {
        id: '@id',
        title: '@ctitle',
      }
    ],
  })
  return data
}
