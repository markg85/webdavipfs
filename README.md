# WebDAV IPFS
This project is a proof of concept (POC) to demonstrate IPFS over WebDAV. With that, a few hefty disclaimers are necessary.

**Disclaimers**
1. WebDAV is meant to give you more control over data on a webserver. It essentially transforms your webserver into a fileserver with quite some interesting functionality. In the context of IPFS the "webserver" is your (kubo) node. The functionality you get is the ability to browse your files (if you know the CID of the parent folder) and open them. This is all read-only! You get **nothing** of the WebDAV writing functionality.
2. Serves as a proof of concept for future kubo gateway development. WebDAV defines a set of http methods that might be valuable to have.
3. Very mixed experience on where you use this.
4. Requires access to your IPFS API (port 5001). As this is intended for future gateway development, it made sense to rely in the IPFS API.
5. There will be lots of bugs!

## Setting expectations
The first smile in each column here is this implementation. The second smile in each column is the `rclone` WebDAV implementation. I took the rclone WebDAV implementation as example to see how well my implementation works (feature wise) when compared to a project that has had much more development time behind it.

| *testcase* | Windows | Linux (KDE) | Android (Solid Explorer) |
| ---------- | ------- | ----- | --------------- |
| File opens |:cry::cry:|:cry::cry:|:smile::smile:|
| Streaming  |:angry::angry:|:angry::angry:|:unicorn::smile:|
| Browsing |:cry::cry:|:smile::smile:|:cry::cry:|
| Metadata works |:smile::smile:|:smile::smile:|:smile::smile:|
| Write prevents |:angry::angry:|:angry::angry:|:angry::angry:|
| Copy |:cry::cry:|:smile::smile:|:smile::smile:|
| Placeholder readme|:smile::smile:|:smile::smile:|:smile::smile:|

Legend: <br>
:angry: = Not working at all. No clear path to fix it either.<br>
:cry: = Works in specific condition or needs manual steps. See note for specific app.<br>
:smile: = All good.<br>
:unicorn: = Anyone's guess, not able to properly test but looks to be working great.<br>

The idea in this table is for a happy smiley face for the "testcase" to work how you'd expect. So say for example opening a file would have the natural expectation of the file just opening.

Below is a description of each non-happy emoji in order of the above table with regards to the case I was testing.

**File opens**<br>
The happy face would be that a file - any file - would open just like any file normally opens in your file browser. This turned out to not be the case in Windows and Linux. Windows has a 50MB file limit for anything in WebDAV. Opening any files below that side works "ok'ish". Opening files above 50MB just downright fails with no error or warning at all. Linux (at least KDE's Dolphin) doesn't have this size limitation. Both have the limitation that each file being openend is first downloaded (you don't get any feedback about that) and opens after the download is completed. That could take a long time!

**Streaming**<br>
Streaming is much realted to file opening. Windows and linux both don't do that as they need to download the data as a whole before it starts playing. Android (Solid Explorer) has a sort of "Streaming service" that runs in the background. I assume it downloads the file you openend in chunks and handels it in those chunks too. Which kinda gives the user an experience of the file immediately playing however large it is. Your experience with Solid Explorer in this regard will feel like you have a native filesystem, which is greeat!

**Browsing**<br>
You'd expect you can browse to `/ipfs/<cid>`, and you'd be right when using the Dolphin file browser under KDE. But on Android and Windows it just doesn't work that way. The reason here is complicated. Say on Windows you want to browse to `/ipfs/<cid>`, you can if your `/ipfs` folder has that `<cid>` as subfolder. But you don't have that. You don't know which CID's you can browser in `/ipfs` thus windows (and Solid Explorer on android) just don't work. They don't know the child in the given parent. KDE's Dolphin simply doesn't care in this case and tries to open it regardless which is why it works there. For Windows and Android (Solid Explorer) you therefore have to specify the exact point you want to browse at the moment of making a WebDAV connection. So if you made a connection to `/ipfs/<cid_x>` and you then want to browse to `/ipfs/<cid_y>` then you have to edit your WebDAV connection to that new CID you want to browse.

**Metadata works**<br>
These are the file attributes that define how your file browser presents entries. For example, an entry with a folder type should be presented as a folder and not as a (for example) json file. This works fine for all tested environment.

**Write prevents**<br>
Write prevents, i do have to specifically highlight these. WebDAV itself doesn't have an explicit read only mode. Therefore what i'm trying here isn't fully supported by WebDAV to begin with. Here the disclaimer of "There will be lots of bugs!" applies. Handling this gracefully is just an implementation detail i didn't bother to further implement.

**Copy**<br>
On windows this experience is poor as you can again only interact with files that are within that 50MB limit. If you interact with anything larger (that includes copy) then it just doesn't work. The other testes environments work just fine here.

**Placeholder readme**<br>
Placeholder readme, these are magical files that you will see on `/ipfs` and `/ipns`. These readme files are just stub single-line files to demonstrate that can be done too. If you're using Windows or Android you likely never see these ad you have to make a mapping there directly to `/ipfs/<cid>`.

## Requirements
You need an IPFS node where you have access to the IPFS API (port 5001 by default). You cannot run this project without it.
Nodejs is a hard requirement too.

## How to run this?
The application uses 2 environment variables:
```
# Set to your IPFS API address. Like http://127.0.0.1:5001
IPFS_API

# n which port do you want this server to run? Default is 1900
WEBDAV_PORT
```

If you run a default IPFS node locally then you don't need to specify any environment variables.

Run the following:
```
# git clone https://github.com/markg85/webdavipfs
# cd webdavipfs
# npm install
# node index.js
```

Of if you have your node running somewhere else, specify the IPFS_API environment variable too:
```
# IPFS_API=<your node>:5001 node index.js
```

This should give you an output like like: `WebDAV IPFS running on 127.0.0.1:1900`

## Browsing your WebDAV folder
I'm only going to mention KDE's dolphin here as anything else has it's own specific ways.

In Dolphin, edit the URL bar to say: `webdav://<webdav server>:1900/ipfs/<cid>`
Depending on your distribution packages this might work. If your packages are in order then you should see a file/folder listing for your CID. Provided that the CID you filled in is a UnixFS folder tree (added to IPFS with `ipfs add -r <folder>`).

## Future development and contributing
Development in this project is probably done mostly. There might be a few bug fixes every now and then. Other then that no major development is expected here.

You can definitely have a look at the code and help improve it if you like to see this move forward! Patches are definitely welcome!
