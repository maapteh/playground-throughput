# tps express cache
> make it faster

Throughput; the higher the better. This means that the server is capable of successfully executing that many number of requests per unit of time. This playground belongs to my article https://medium.com/@mpth/nodejs-and-react-ssr-the-need-for-foul-play-30c0f795e72a

## Introduction
Two middlewares are introduced to be able to have a better TPS with express. It is all based on our current max TPS. Then we take 5 off this amount to be able to still have CPU power to handle responses from memory.

Start with passing your React/Angular/Vue/Whatever html output of your page into `src/constants/sample-html`. The more html/initial state the worser the express TPS.

### Find your healthy max
First find max TPS without middleware by not starting the middlewares.

tab 1: `RATELIMIT=34 TOGGLE_RATELIMIT=off TOGGLE_CACHING=off npm start`
tab 2: `hey -n 600 -c 40 -z 10s -m GET -cpus 1 -H "Cookie: token=284770085.1573902413" http://localhost:3000`

Look for Requests/sec and use this value to ratelimit the application. Remove remove 5/10 tps from it to give room for having CPU to process more from cache. Now proceed with:

tab 1: `RATELIMIT=XXXVALUEXXXX TOGGLE_RATELIMIT=on TOGGLE_CACHING=on npm start`
tab 2: `hey -n 600 -c 40 -z 10s -m GET -cpus 1 -H "Cookie: token=284770085.1573902413" http://localhost:3000`

and see you can serve more.

## Testing
loadtesting is done with [rakyll/hey](https://github.com/rakyll/hey) locally. On our builds we use gatling.

anonymous
1. `hey -n 600 -c 40 -z 10s -m GET -cpus 1 http://localhost:3000`
2. `hey -n 600 -c 40 -z 10s -m GET -cpus 1 http://localhost:3000/error`
3. `hey -n 600 -c 40 -z 10s -m GET -cpus 1 http://localhost:3000/none`

not anonymous
1. `hey -n 600 -c 40 -z 10s -m GET -cpus 1 -H "Cookie: token=284770085.1573902413" http://localhost:3000`



## DEBUG
example anonymous:
```
  mpth@MPTH  ~  hey -n 1600 -c 140 -z 10s -m GET -cpus 1 http://localhost:3000

Summary:
  Total:	10.0216 secs
  Slowest:	0.2714 secs
  Fastest:	0.0059 secs
  Average:	0.0566 secs
  Requests/sec:	2455.8944

  Total data:	593149200 bytes
  Size/request:	24100 bytes

Response time histogram:
  0.006 [1]	|
  0.032 [1328]	|■■■
  0.059 [16539]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  0.086 [4525]	|■■■■■■■■■■■
  0.112 [901]	|■■
  0.139 [655]	|■■
  0.165 [309]	|■
  0.192 [189]	|
  0.218 [64]	|
  0.245 [59]	|
  0.271 [42]	|


Latency distribution:
  10% in 0.0338 secs
  25% in 0.0395 secs
  50% in 0.0517 secs
  75% in 0.0606 secs
  90% in 0.0828 secs
  95% in 0.1155 secs
  99% in 0.1762 secs

Details (average, fastest, slowest):
  DNS+dialup:	0.0005 secs, 0.0059 secs, 0.2714 secs
  DNS-lookup:	0.0000 secs, 0.0000 secs, 0.0031 secs
  req write:	0.0001 secs, 0.0000 secs, 0.0340 secs
  resp wait:	0.0516 secs, 0.0055 secs, 0.2644 secs
  resp read:	0.0042 secs, 0.0000 secs, 0.1135 secs

Status code distribution:
  [201]	24612 responses
```

## Next

1. use [@mpth/react-in-view](https://www.npmjs.com/package/@mpth/react-in-view) for making some components SSR faster and use what gets into our view
2. change some components so state comes clientside [@mpth/react-no-ssr](https://www.npmjs.com/package/@mpth/react-no-ssr)
3. see for small tweaks to less block our event loop
4. create faster render engine examples like hyperloop
