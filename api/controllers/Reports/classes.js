module.exports = async (req, res) => {

  if (req.query.format) {
    const classesFileAction = require('./classes-file')
    return await classesFileAction(req, res)
  }

  if (!await sails.helpers.can(req.user, 'read', 'Order')) {
    return res.forbidden()
  }

  const reportParams = {
    clientId: req.client.id,
    teachers: req.body.teachers || req.query.teachers,
    fromDate: req.body.fromDate || req.query.fromDate,
    endDate: req.body.endDate || req.query.endDate,
  }

  const classesData = await sails.helpers.reports.classes.with(reportParams)

  return res.json(classesData)


}
