#!/bin/bash
cd /home/kavia/workspace/code-generation/secure-user-authentication-service-32e9faf8/user_auth_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

