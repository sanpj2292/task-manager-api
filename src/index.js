const express = require('express');
// Just to make sure the file runs
require('./db/mongoose');
const bodyParser = require("body-parser");

const app = express();
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = process.env.PORT;
// app.use((req, res, next) => {
//     res.status(503).send('In Maintenance mode, we\'ll get soon back up!');
// });


const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

app.use(userRouter);
app.use(taskRouter);


app.listen(port, () => {
    console.log(`Server is up on port:${port}`);
});