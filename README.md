# kickass-so
This is a node module and CLI application which searches kickass.so for torrents. As a module, it serves as a simple wrapper to kickass.so's JSON API. The CLI application uses the module to perform a search against kickass.so's torrent database, and returns the most relevant torrent links and data associated with the torrents. The main reason I made this is because the existing kickass.so modules do not allow you to search by category, and most are outdated. Also, the CLI application is a really handy way to get torrent links to copy and paste into deluge-console using tmux :)

## Installation
To use the CLI application, use

```npm install -g kickass-so```

If you just want to use it is as a module, install it to your project with

```npm install --save kickass-so```

## CLI Application Usage
A basic torrent search would look something like

```kickass -c tv south park```

In this example, I passed the optional -c flag to specify the search category. kickass.so returns search results in sets of 25. You can specify the page # you want returned by passing the -p flag. So if you wanted to go to the second page of South Park TV torrents, you would run

```kickass south park -c tv -p 2```

And that's all there is to it. The application and module orders torrents by seeders in descending order by default. Note that you do not have to surround a multi-word search query in quotes.

## Module usage
To use this module in your application, install it to your project and use

```var kickass = require('kickass-so');```

You can perform a basic search with

```kickass('search query', function (err, results) {
  // do something with results
})```

If you want to do anything besides a search request for the first 25 torrents sorted by seeders, you will have to pass an object to the function instead of a string. The object can contain the following keys
* `search`: This will be your search query.
* `category`: This will be the search category.
* `page`: This will be the page # of the returned results.
* `field`: This will be the field by which the results are sorted, default is 'seeders'. Other possibilities include 'time\_add', 'files\_count', 'size', and 'leechers'.
* `sorder`: This will be the order the results are displayed in, default is 'desc'. Alternatively you can use 'asc'.

The JSON returned by kickass.so will be parsed into an object for you and available in the second argument to the function you pass to the module. I will give an overview of the format of this object. Assuming `results` is the name of the object,
* `results.total_results`: The total amount of torrent results.
* `results.link`: Always 'http://kickass.so'.
* `results.language`: Using this module you will always get 'en-us'
* `results.ttl`: The ttl of the response.
* `results.list`: An array containing the torrents and their info.
The information you are probably looking for will be in `results.list`. The keys of a torrent object are:
* `title`: The title of the torrent.
* `category`: The category of torrent.
* `link`: The link to the torrent as it is on kickass.so
* `guid`: Same as above.
* `pubDate`: The date the torrent was published.
* `torrentLink`: The link to the actual torrent file.
* `files`: The amount of files associated with the torrent.
* `comments`: The amount of comments the torrent received on kickass.so
* `hash`: A hash digest of the torrent.
* `peers`: The amount of peers associated with the torrent.
* `seeds`: The amount of seeders providing the torrent.
* `leechs`: The amount of leeches downloading the torrent.
* `size`: The size (in bytes) of the torrent.
* `votes`: The amount of votes the torrent received on kickass.so
* `verified`: Whether or not the torrent is verified.
## License
MIT. Feel free to modify and distribute.
## Author
Raymond Pulver IV
