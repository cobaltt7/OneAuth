[![1Auth logo](https://auth.onedot.cf/logo.svg)](https://auth.onedot.cf/)

# About 1Auth All-In-One Authentication

## About

1Auth is an all-in-one authentication client that we designed to work seamlessly with any website. It currrently supports 5 clients with many more to come.

## Supported Clients

-   Email
-   Google
-   Replit
-   GitHub
-   Scratch

## For Developers

Implementing this in your own site is very easy. Simply direct your users to this URL:

```http
https://auth.onedot.cf/?url=<CALLBACK_URL>
```

After the user clicks on the link and finishes authentication with us, we will redirect them to whatever url you specified in `<CALLBACK_URL>`. There will be an extra search parameter on the URL: `code`. To retrive the user's information, send the following HTTP request:

```http
GET https://auth.onedot.cf/backend/get_data/<CODE>
```

where `<CODE>` is the value of the appended search parameter.

More configuration options will come soon.
