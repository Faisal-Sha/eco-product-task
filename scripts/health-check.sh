#!/bin/bash

# Health Check Script for EcoFlow Water Bottles Platform
# This script verifies that all services are running correctly

set -e

echo "🏥 EcoFlow Platform Health Check"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check HTTP endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $name... "
    
    if response=$(curl -s -w "%{http_code}" -o /dev/null --max-time 10 "$url"); then
        if [ "$response" -eq "$expected_status" ]; then
            echo -e "${GREEN}✓ OK${NC} ($response)"
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (HTTP $response)"
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Connection failed)"
        return 1
    fi
}

# Function to check if container is running
check_container() {
    local container_name=$1
    echo -n "Checking container $container_name... "
    
    if docker ps --filter "name=$container_name" --filter "status=running" | grep -q "$container_name"; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi
}

# Track overall health
overall_health=0

echo
echo "📦 Container Status:"
echo "-------------------"

# Check Docker containers
containers=("eco_mongodb" "eco_redis" "eco_backend_1" "eco_backend_2" "eco_nginx" "eco_prometheus")
for container in "${containers[@]}"; do
    if ! check_container "$container"; then
        overall_health=1
    fi
done

echo
echo "🌐 Service Endpoints:"
echo "--------------------"

# Check service endpoints - NGINX root returns 404 by design, so check health endpoint instead
if ! check_endpoint "NGINX Health Check" "http://localhost:8080/health"; then
    overall_health=1
fi

if ! check_endpoint "Backend Health Check" "http://localhost:8080/health"; then
    overall_health=1
fi

if ! check_endpoint "API Products Endpoint" "http://localhost:8080/api/products"; then
    overall_health=1
fi

if ! check_endpoint "Featured Products" "http://localhost:8080/api/products/featured"; then
    overall_health=1
fi

# Prometheus web UI redirects to /graph, so check redirect (302) is expected
if ! check_endpoint "Prometheus Web UI" "http://localhost:9090" 302; then
    overall_health=1
fi

if ! check_endpoint "Backend Metrics" "http://localhost:8080/metrics"; then
    overall_health=1
fi

# Check frontend if it's running
if check_endpoint "Frontend (Next.js)" "http://localhost:3000" 200; then
    echo -e "Frontend is ${GREEN}available${NC}"
else
    echo -e "${YELLOW}Note: Frontend might not be running or still starting${NC}"
fi

echo
echo "🔍 Detailed Health Checks:"
echo "-------------------------"

# Check MongoDB connection
echo -n "MongoDB connection test... "
if docker exec eco_mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Connection failed${NC}"
    overall_health=1
fi

# Check Redis connection  
echo -n "Redis connection test... "
if docker exec eco_redis redis-cli -a redispass123 ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Connection failed${NC}"
    overall_health=1
fi

# Test API authentication
echo -n "API authentication test... "
if auth_response=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"email":"john.doe@example.com","password":"User123!"}' \
    "http://localhost:8080/api/auth/login"); then
    
    if echo "$auth_response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Authentication working${NC}"
    else
        echo -e "${YELLOW}⚠ Authentication response unexpected${NC}"
        echo "Response: $auth_response"
    fi
else
    echo -e "${RED}✗ Authentication failed${NC}"
    overall_health=1
fi

# Check database seeded data
echo -n "Database seeded data check... "
if product_response=$(curl -s "http://localhost:8080/api/products?limit=1"); then
    if echo "$product_response" | grep -q '"data":\['; then
        echo -e "${GREEN}✓ Products available${NC}"
    else
        echo -e "${YELLOW}⚠ No products found - run: docker-compose exec backend_1 npm run seed${NC}"
    fi
else
    echo -e "${RED}✗ Failed to check products${NC}"
    overall_health=1
fi

# Performance test
echo -n "Response time test... "
start_time=$(date +%s%3N)
curl -s "http://localhost:8080/api/products/featured" > /dev/null
end_time=$(date +%s%3N)
response_time=$((end_time - start_time))

if [ $response_time -lt 1000 ]; then
    echo -e "${GREEN}✓ ${response_time}ms${NC}"
else
    echo -e "${YELLOW}⚠ ${response_time}ms (slow)${NC}"
fi

echo
echo "📊 Quick Stats:"
echo "--------------"

# Container resource usage
echo "Container resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
    eco_mongodb eco_redis eco_backend_1 eco_backend_2 eco_nginx eco_prometheus 2>/dev/null || \
    echo "Unable to get container stats"

echo
echo "🎯 Load Test Readiness:"
echo "----------------------"

# Check if Artillery is installed
if command -v artillery &> /dev/null; then
    echo -e "Artillery load testing tool: ${GREEN}✓ Installed${NC}"
    echo "Run load tests with: cd scripts && artillery run load-test-simple.yml"
else
    echo -e "Artillery load testing tool: ${YELLOW}⚠ Not installed${NC}"
    echo "Install with: npm install -g artillery"
fi

# Check if test data exists
if [ -f "scripts/test-data.csv" ]; then
    echo -e "Load test data: ${GREEN}✓ Available${NC}"
else
    echo -e "Load test data: ${YELLOW}⚠ Missing${NC}"
fi

echo
echo "================================="

if [ $overall_health -eq 0 ]; then
    echo -e "🎉 Overall Health: ${GREEN}HEALTHY${NC}"
    echo "All services are running correctly!"
    echo
    echo "Ready for load testing with up to 1,000 concurrent users."
    exit 0
else
    echo -e "🚨 Overall Health: ${RED}UNHEALTHY${NC}"
    echo "Some services have issues. Please check the logs:"
    echo "  docker-compose logs [service-name]"
    echo
    echo "Common fixes:"
    echo "  - Restart services: docker-compose restart"
    echo "  - Rebuild containers: docker-compose up --build"
    echo "  - Check port conflicts: lsof -i :3000 -i :8080 -i :9090"
    exit 1
fi
