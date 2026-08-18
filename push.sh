set -euo pipefail

IMAGE="ghcr.io/constantine950/aabo"
TAG="${1:-latest}"

docker build -t "${IMAGE}:${TAG}" .
docker push "${IMAGE}:${TAG}"

echo "Pushed ${IMAGE}:${TAG}"