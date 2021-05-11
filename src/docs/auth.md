# Adding an authenitcation client

Make a folder in the `routes/auth` directory with the name of the client.

Add a file in that folder called `index.js`.

`index.js` should be a module that exports the following (required ones have a asterisk):

-   **`name`\***: Name of the client
-   **`link`\***: Absoolute URL that users are directed to when they click the button. `{{url}}` will be replaced with the URI-encoded URL to be redirected to. Each client is responsible for storing it in some way.
-   **`icon`\***: Icon of the client. Should be one of
    -   a URL (absolute or relative)
    -   the name of a [free FontAwesome icon](https://fontawesome.com/icons?m=free) (without the `fa-` prefix)
    -   the name of an SVG file in the `routes/svg` directory (without the `.svg` extention)
-   **`iconProvider`\***: Determines which of the above `icon` is. Should be one of
    -   `url` if `icon` is a URL
    -   `fa` if `icon` is the name of a FontAwesome icon
    -   `svg` if `icon` is the name of a SVG file
-   **`pages[]post`**: Function that runs on a `POST` request to `pages[]backendPage`. Takes three arguments:
    1. _`req`_: Express request object
    2. _`res`_: Express response object
    3. _`sendResponse`_: Function to be run once you are at a point where you can access the user's data without any further interaction. Takes three arguments:
        1. _`tokenOrData`_\*: Token _returned by the **client**_ that can be passed to the `getData` function. Alternatively, this can be the user's data if the client doesn't return tokens (see `rawData`).
        2. _`url`_\*: URL to redirect to after the user gives permission. Should be sourced from `{{url}}` (in `link`).
        3. _`res`_\*: Express response object
-   **`pages[]get`**: Function that runs on a `GET` request to `pages[]backendPage`. Takes the same three arguments as `pages[]post`.

backendPage: Page that handles the said HTTP requests. Relative to <HOSTNAME>/auth/

getData: Function that return a users' data based on a token. Takes one argument:

token: token passed to pages.post.sendResponse via tokenOrData

rawData: boolean that determines if instead of passing a token to sendResponse, you will send the users' data directly. ONLY USE IF ALL THE DATA YOU RE SENDING CAN BE VIEWED BY ANYONE ANYWHERE ANYTIME
