Wrapper around @now/node-bridge with one change:
In order to work with AWS Application Load Balancer, lambda function has to return `isBase64Encoded: true` along with other properties.

```diff
        response.headers['content-length'] = String(bodyBuffer.length);
    }
    resolve({
+       isBase64Encoded: true,
        statusCode: response.statusCode || 200,
        headers: response.headers,
        body: bodyBuffer.toString('base64'),
```

I would love to find an easier way to apply this change to @now/node-bridge
