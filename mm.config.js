module.exports = ({mockjs}) => {
  return {
    port: 8100,
    testPort: 8105,
    replayPort: 8101,
    remote: true,
    hostMode: true,
    api (util) {
      const { run } = util
      return {
        'get /name' (req, res, next) {
          res.json({
            id: mockjs.mock(`@id`),
            name: mockjs.mock(`@cname`),
          })
        },
      }
    },
  }
}
