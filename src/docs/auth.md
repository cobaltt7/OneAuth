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
-   **`pages[]backendPage`**: Page that handles the said HTTP requests. Relative to `/auth/`. This could include `../` but that is highly discouraged and should only be used if there is no other way.
-   **`pages[]METHOD`**: Function that runs on a HTTP request to `pages[]backendPage`, where `METHOD` is the HTTP method. Supported methods:
    <!-- -   `all` -->

    -   `checkout`
    -   `copy`
    -   `delete`
    -   `get`
    -   `head`
    -   `lock`
    -   `merge`
    -   `mkactivity`
    -   `mkcol`
    -   `move`
    -   `m-search`
    -   `notify`
    -   `options`
    -   `patch`
    -   `post`
    -   `purge`
    -   `put`
    -   `report`
    -   `search`
    -   `subscribe`
    -   `trace`
    -   `unlock`
    -   `unsubscribe`

    The function takes three arguments:

    1. _`request`_: Express request object
    2. _`response`_: Express response object
    3. _`sendResponse`_: Function to be run once you are at a point where you can access the user's data without any further interaction. Takes three arguments: 1. _`tokenOrData`_: Token _returned by the **client**_ that can be passed to the `getData` function. Alternatively, this can be the user's data if the client doesn't return tokens (see `rawData`). 2. _`url`_: URL to redirect to after the user gives permission. Should be sourced from `{{ url }}` (in `link`). You can have multiple methods in the same page object.

-   **`getData`**: Function that returns a users' data based on a token. Takes one argument:
    1. **`token`**: Token that came from `pages[].METHOD.sendResponse` in the `tokenOrData` parameter.
-   **`rawData`**: Determines if instead of passing a token to `pages[].METHOD.sendResponse` in the `tokenOrData` parameter, you will send the users' data directly. _**Only use this if all the data you are sending can be viewed at the client's website by anyone, at any time!**_

**Protip: when debugging your client, start [here](https://auth.onedot.cf/auth?url=https%3A%2F%2Fauth.onedot.cf%2Fbackend%2Fget_data). That way it will automatically show you the retrieved data at the end!**
