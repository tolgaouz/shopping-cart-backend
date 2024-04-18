import { AuthObject } from "@clerk/clerk-sdk-node";
import app from "./app";

declare global {
  namespace Express {
    interface Request {
      auth: AuthObject;
    }
  }
}

const port = process.env.PORT || 5000;
app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});
