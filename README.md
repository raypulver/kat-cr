# kat-cr
![build status](https://ci.appveyor.com/api/projects/status/github/raypulver/kat-cr)

This is a node module and CLI application which searches kat.cr for torrents. The JSON API is no longer fully supported by kickass torrents and the RSS feed is also lacking. The browser search engine offers the most features, so that is what this application uses to search for torrents.


## Installation
To use the CLI application, use

```
npm install -g kat-cr
```

This will install an executable `kickass` to your `PATH`.

If you want to use it is as a module, install it to your project with

```
npm install --save kat-cr
```


## CLI Application Usage

A basic torrent search would look something like

```
kickass -c tv south park
```

In this example, I passed the optional -c flag to specify the search category. kat.cr returns search results in sets of 25. You can specify the page # you want returned by passing the -p flag. So if you wanted to go to the second page of South Park TV torrents, you would run

```
kickass south park -c tv -p 2
```

By default, `kickass` will display direct torrent links but if you provide the `-m` or `--magnet` option, the links returned will be the magnet links. As an example:

```
kickass south park -c tv -p 2 -m
```

The torrent titles will be displayed in bold yellow if they are torrents posted by a Kickass Torrents verified member, and there will be a purple `ELITE` qualifier before any torrents posted by a Kickass Torrents elite member.

And that's all there is to it. The application and module orders torrents by seeders in descending order by default. Note that you do not have to surround a multi-word search query in quotes.

## Module usage
To use this module in your application, install it to your project and use

```
var kickass = require('kat-cr');
```

`kat-cr` uses a promise API; you can perform a basic search with

```
kickass('search query').then(function (results) {
  // do something with results
}, function (err) {
 // handle error
});
```

If you want to do anything besides a search request for the first 25 torrents sorted by seeders, you will have to pass an object to the function instead of a string. The object can contain the following keys
* `search` {string}: The search query
* `category` {string}: The search category
* `page` {number}: The page # of the returned results
* `field` {string}: The field by which the results are sorted, default is 'seeders'. Other possibilities include 'time\_add', 'files\_count', 'size', and 'leechers'
* `sorder` {string}: The order the results are displayed in, default is 'desc'. Alternatively you can use 'asc'

The object resolved by this promise is designed to mimic the JSON response returned by the currently useless Kickass Torrent JSON API, but the actual object is a custom `KickassResultGroup` object, which at this stage does not have any methods on its prototype, but contains some properties relevant to the entire search result:
* `results.total_results` {number}: The total amount of torrent results
* `results.link` {string}: Always 'http://kat.cr'
* `results.language` {string}: Using this module you will always get 'en-us'
* `results.list` {Array}: An array containing the torrents and their info

The bulk of the information will be in `results.list`. The properties of a torrent object are:
* `title` {string}: The title of the torrent
* `category` {string}: The category of torrent
* `link` {string}: The link to the torrent page on kat.cr
* `pubDate` {Date}: a Date instance representing the date the torrent was published
* `torrentLink` {string}: The direct http link to the torrent file
* `magnetLink` {string}: The magnet link associated with the torrent
* `files` {number}: The amount of files associated with the torrent
* `comments` {number}: The amount of comments the torrent received on kat.cr
* `hash` {number}: A hash digest of the torrent
* `peers` {number}: The amount of peers associated with the torrent
* `seeds` {number}: The amount of seeders associated the torrent
* `leechs` {number}: The amount of leeches downloading the torrent
* `size` {string}: The size of the torrent with a qualifier (KB, MB, etc.)
* `verified` {boolean}: Whether or not the torrent was posted by a Kickass Torrents verified user
* `elite` {boolean}: Whether or not the torrent was posted by a Kickass Torrents elite user
* `id` {string}: The torrent ID on kat.cr that can be used to call API functions

Each item in `results.list` is actually a `KickassResult` object, which currently has the following methods on its prototype:

* `KickassResult#getComments()`: Return a promise that resolves with an array of comment objects, which have an `owner` and a `comment` property representing the screen name of the comment poster and the content of the comment, respectively
* `KickassResult#getDetails()`: Make an HTTP request to the dedicated webpage associated with the torrent result and return a promise which resolves with an object containing additional details about the torrent. At this stage the only additional detail provided by the resolved object is stored in the `description` property, which contains the text-only version of the torrent description


## Note

The URL to Kickass Torrents is expected to change. In case it has not yet been updated, put the new URL into `config/kickass-url.json`

Always keep your global `kat-cr` package updated.


## Testing

kat-cr is a web scraping module and thus it depends on the structure of the Kickass Torrents search response, as well as the current domain name of the Kickass torrents server. In case of updates to Kickass Torrents, running

```
npm test
```

in the project directory will indicate what exactly went wrong with the attempt to convert a Kickass Torrents search response into a `KickassResultGroup` object, and contributors are invited to submit pull requests correcting the API endpoints, domain name, or CSS selectors.

Make sure `mocha` is installed globally, and that you run `npm install` in the project directory before attempting to run the tests.


## License

MIT. Feel free to modify and distribute.


## Author

Raymond Pulver IV
