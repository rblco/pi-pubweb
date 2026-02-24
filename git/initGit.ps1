cd .\_src.host\_repos\pi\pubWeb

# 1) Initialize git (if not already)
git init

# 2) Add files + first commit
git add .
git commit -m "Initial commit"

# 3) Set main branch name
git branch -M main

# 4) Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/rblco/pi-pubweb

# 5) Push and set upstream
git push -u origin main
