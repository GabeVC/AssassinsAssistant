const Koa = require('koa');
const Router = require('koa-router');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(bodyParser()); // Parse incoming request bodies

// Sample route
router.get('/api', async (ctx) => {
  ctx.body = {
    message: 'Test Connect'
  };
});

// Sample POST route
router.post('/api/data', async (ctx) => {
  const requestData = ctx.request.body;
  ctx.body = {
    message: 'Data received successfully',
    data: requestData
  };
});

// Apply the routes to the Koa application
app
  .use(router.routes())
  .use(router.allowedMethods());

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Koa API server is running on port ${PORT}`);
});
