const fs = require("fs");

const path = require("path");

const csv = require("csv-parser");

const results = [];

fs.createReadStream(

  path.join(

    __dirname,

    "../data/EQUITY_L.csv"

  )

)

.pipe(csv())

.on("data", (row) => {

  if (

    row.SYMBOL &&

    row["NAME OF COMPANY"]

  ) {

    results.push({

      symbol:

        `${row.SYMBOL}.NS`,

      name:

        row["NAME OF COMPANY"]

    });

  }

})

.on("end", () => {

  fs.writeFileSync(

    path.join(

      __dirname,

      "../data/stocks.json"

    ),

    JSON.stringify(

      results,

      null,

      2

    )

  );

  console.log(

    `Converted ${results.length} stocks`

  );

});