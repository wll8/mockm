module.exports = ({mockjs}) => {
  return {
    prot: 8100,
    testProt: 8105,
    replayProt: 8101,
    remote: true,
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
