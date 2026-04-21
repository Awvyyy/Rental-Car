const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { price } = require('./rentalPrice');

const app = express();
const port = 3000;

const formHtml = fs.readFileSync(path.join(__dirname, 'form.html'), 'utf8');
const resultHtml = fs.readFileSync(path.join(__dirname, 'result.html'), 'utf8');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/pictures', express.static('images'));

app.get('/', (_req, res) => {
  res.send(formHtml);
});

app.post('/', (req, res) => {
  const {
    pickup,
    dropoff,
    pickupdate,
    dropoffdate,
    type,
    age,
    licenseYears,
  } = req.body;

  const result = price(
    String(pickup),
    String(dropoff),
    String(pickupdate),
    String(dropoffdate),
    String(type),
    Number(age),
    Number(licenseYears),
  );

  res.send(formHtml + resultHtml.replaceAll('$0', result));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
