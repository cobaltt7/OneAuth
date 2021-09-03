# [![OneAuth logo](https://auth.onedot.cf/logo.svg)](https://auth.onedot.cf/)

## OneAuth All-In-One Authentication

[Cloud hosted on opeNode.io](https://www.openode.io/)

### About

OneAuth is an all-in-one authentication client that we designed to work seamlessly with any website. We support 6 clients with many more to come.

### Supported Clients

-   Discord
-   Email
-   GitHub
-   Google
-   Replit
-   Scratch

[If you like, you may demo the different clients here.](https://auth.onedot.cf/auth?url=https%3A%2F%2Fauth.onedot.cf%2Fbackend%2Fget_data)

### For Developers

We designed OneAuth so that adding it to your site is as streamlined as possible. When a user clicks “Sign in” on your site, direct them to this URL:

```http
https://auth.onedot.cf/auth?url=<CALLBACK_URI>
```

After the user clicks on the link and finishes authentication with us, we will redirect them to whatever URL you used in place of `<CALLBACK_URL>` above. If they allowed sharing their data, then there will be a new query parameter on that URL, `code`. To retrieve the user’s information, send the following HTTP request, where `<CODE>` is the value of the said parameter:

```http
GET https://auth.onedot.cf/backend/get_data/?code=<CODE>
```

**_NEW!!_** **Language specification** - Specify the language to use on pages by adding another parameter to the URL: `language`. Its value should be a 2-letter language code like `en` or `es`. You may follow it by an underscore and a 2-letter country code, e.g. `en_GB` or `es_AR` (optional). If a language is not available, it will fall back to the non-country-specific language, then to the users’ browser language. _Please note that we do not have many translations, if any. That will change as our translation team grows. [If you would like to help us translate, please click here.](https://www.transifex.com/1dot/1auth/) Create a Transifex account if you do not already have one, then click “Join team”. Thanks for your eagerness to help! (Please note that if your language is not in the list, you will have to scroll down to the bottom and click “Request language” first.)_

If they denied sharing their data, then there will not be any new query parameter.

More configuration options are coming soon.
