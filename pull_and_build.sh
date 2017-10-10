#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# blocknetdx autobuilder
export HOME=/home/dev
export GITIAN=$HOME/git/gitian-builder/
export GITHUB_TOKEN=d572cf9939485c9f1da99d97e17c904fbc6afcb7
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
export FILEPATH=$HOME/out
export REPOPATH=$HOME/git/BlockDX

pwd=$(pwd)

lastsuccessbuild=$(cat "./lastsuccessbuild.txt")
echo "old tag: ${lastsuccessbuild}"

##jump into the repo and pull changes. Get the latest tag
cd $REPOPATH
git pull
newesttag=$(git describe --abbrev=0 --tags | sed 's/[^0-9.]*//g')
echo "new tag: ${newesttag}"

cd $GITIAN

if [ "${lastsuccessbuild}" != "${newesttag}" ]; then

  ./bin/gbuild --commit blocknetdx=v${newesttag} ../BlockDX/contrib/gitian-descriptors/gitian-win.yml -j64 &&
  ./bin/gbuild --commit blocknetdx=v${newesttag} ../BlockDX/contrib/gitian-descriptors/gitian-linux.yml -j64 &&
  ./bin/gbuild --commit blocknetdx=v${newesttag} ../BlockDX/contrib/gitian-descriptors/gitian-osx.yml -j64 &&

  #https://unix.stackexchange.com/questions/101916/copy-only-regular-files-from-one-directory-to-another/101923?noredirect=1#comment459686_101923
  #cp ./build/out/* $FILEPATH &&
  find ./build/out -maxdepth 1 -type f | xargs -I {} cp {} $FILEPATH

  shasum=$(python extract_shas.py) && 
  echo "${shasum}" &&

  $GOPATH/bin/github-release release \
    --user pelorusjack \
    --repo BlockDX \
    --tag v${newesttag} \
    --name "build ${newesttag} of BlockNet Wallet" \
    --description "${shasum}" &&

  $GOPATH/bin/github-release upload \
        --user pelorusjack \
        --repo BlockDX \
        --tag v${newesttag} \
        --name "blocknetdx-${newesttag}-i686-pc-linux-gnu.tar.gz" \
        --file $FILEPATH/blocknetdx-${newesttag}-i686-pc-linux-gnu.tar.gz && 
  
  $GOPATH/bin/github-release upload \
        --user pelorusjack \
        --repo BlockDX \
        --tag v${newesttag} \
        --name "blocknetdx-${newesttag}-win64.zip" \
        --file $FILEPATH/blocknetdx-${newesttag}-win64.zip && 
  
  $GOPATH/bin/github-release upload \
        --user pelorusjack \
        --repo BlockDX \
        --tag v${newesttag} \
        --name "blocknetdx-${newesttag}-win32.zip" \
        --file $FILEPATH/blocknetdx-${newesttag}-win32.zip && 

  $GOPATH/bin/github-release upload \
        --user pelorusjack \
        --repo BlockDX \
        --tag v${newesttag} \
        --name "blocknetdx-${newesttag}-osx64.tar.gz" \
        --file $FILEPATH/blocknetdx-${newesttag}-osx64.tar.gz && 
  cd $pwd && 
  echo "${newesttag}" > "./lastsuccessbuild.txt" &&
  echo "Completed build and release of v${newesttag}"
fi


