const moment = require('moment');
const knex = require('../../services/knex')
const axios = require('axios').default;

module.exports = async (req, res) => {
  console.log("welcome - 1");
  const partner_id = req.params.id;
  const page = req.query.page;
  const page_size = req.query.page_size; 
  console.log("welcome - 2");
  const venues = await Branch.find({client: partner_id});
  const clients = await knex({c: 'client'})
  .leftJoin({i: 'image'}, 'i.id', 'c.logo')
  .select(
    knex.raw("c.name AS name"),
    knex.raw("c.address_1 AS address_1"), 
    knex.raw("c.address_2 AS address_2"),
    knex.raw("c.city AS city"),
    knex.raw("c.zip_code AS zip_code"),
    knex.raw("c.country AS country"),
    knex.raw("c.phone AS phone"),
    knex.raw("c.email AS email"),
    knex.raw("c.website AS website"),
    knex.raw("i.original_width AS width"),
    knex.raw("i.original_height AS height"),
    knex.raw("i.filename AS uri"))
  .where('c.id', partner_id);
  console.log("welcome - 3");
  console.log("page = ", page);
  console.log("page_size = ", page_size);
  console.log("clients = ", clients);
  if (!page) return res.badRequest("Missing query 'page'");
  if (!page_size) return res.badRequest("Missing query 'page_size'");
  if (clients.length == 0) return res.badRequest("Invalid partner_id");  
  console.log("welcome - 4");
  if (venues.length == 0) {
    let fakeVenue = {};
    fakeVenue.id = `client_${partner_id}_default_branch`;
    fakeVenue.name = clients[0].name;
    fakeVenue.updatedAt = clients[0].updatedAt;
    venues.push(fakeVenue);
  }

  console.log("welcome - 5");

  const countOfVenues = venues.length;
  let resData = {};
  resData.venues = [];
  resData.pagination = {
    page: page,
    page_size: page_size,
    total_pages: Math.ceil(countOfVenues / page_size)
  };

  console.log("welcome - 6");

  if (page_size * (page - 1) < countOfVenues) {
    // page number is valid
    const numOfLastVenue = (page_size * page < countOfVenues) ? page_size * page : countOfVenues;
    for (let i = (page_size * (page - 1)); i < numOfLastVenue; i++) {
      let venue = {};
      venue.partner_id = partner_id;
      venue.venue_id = venues[i].id;
      venue.venue_name = venues[i].name;
      venue.address = {
        address_line1: clients[0].address_1,
        address_line2: clients[0].address_2,
        city: clients[0].city,
        zip: clients[0].zip_code,
        country: clients[0].country,
      };
      venue.phone = clients[0].phone;
      venue.email = clients[0].email;
      venue.website = clients[0].website;
      venue.last_updated = moment(venues[i].updatedAt).format();

      venue.images = [];
      if (clients[0].uri) {
        if (clients[0].width) {
          venue.images.push({
            width: clients[0].width,
            height: clients[0].height,
            url: `${sails.config.imgixServer}/${clients[0].uri}`,
          });
        } else {
          let result = await axios.get(`${sails.config.imgixServer}/${clients[0].uri}?fm=json`)
          venue.images.push({
            width: result.data.PixelWidth,
            height: result.data.PixelHeight,
            url: `${sails.config.imgixServer}/${clients[0].uri}`,
          });
        }
      }

      resData.venues.push(venue);
    }
  } else {
    // page number is invalid
  }

  console.log("resData = ", resData);

  return res.json(resData);
}
