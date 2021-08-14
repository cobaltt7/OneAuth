# Adding an authentication client

Make a folder in the `auth` directory with the name of the client.

Add a file in that folder called `index.js`.

`index.js` should be a module that exports the following:

-   **`name`**: Name of the client
-   **`website`**: The website of the client. If the client does not have a website (AKA email authentication), this should not be specified.
-   **`link`**: Absolute URL that users are directed to when they click the button. `{{ url }}` will be replaced with the URL-encoded URL to be redirected to. Each client is responsible for storing it in some way.
-   **`icon`**: Icon of the client. Should be either
    -   a URL (absolute or relative)
    -   the name of a [free Font Awesome icon](https://fontawesome.com/icons?m=free) (without the `fa-` prefix)
-   **`fontAwesome`**: The FontAwesome style/prefix (`fa`, `fas`, `fab`, etc.) if `icon` is the name of a FontAwesome icon. If `icon` is a URL, this should not be specified.
-   **`pages`**: Object where the key is a page, relative to `/auth/`, that handles the said HTTP requests. This could include `../` but that is highly discouraged and should only be used if there is no other way to write your client.
-   **`pages.*.METHOD`**: Function that runs on a HTTP request to `pages[]backendPage`, where `METHOD` is the HTTP method. [Supported methods are listed here](http://expressjs.com/en/api.html#routing-methods). Note we also support `all` and you should try to use that as much as possible. You can have multiple handlers in the same object. The function's call signature is the same as [the `app.use` callback](http://expressjs.com/en/api.html#middleware-callback-function-examples) but without the optional first parameter `error`. The function should **not** be an arrow function. Inside the function, you can access `this.sendResponse`, which you should run once you have obtained the user's data. Takes two arguments:
    1. _`data`_: The data.
    2. _`nonce`_: The random string of characters sourced from `{{nonce}}` in `link`.

**Protip: when debugging your client, start [here](http://localhost:3000/auth?url=http%3A%2F%2Flocalhost:3000%2Fbackend%2Fget_data). That way it will automatically show you the retrieved data at the end!**
