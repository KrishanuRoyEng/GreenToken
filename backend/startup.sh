set -e

echo "🚀 Starting Blue Carbon MRV Backend..."

# Function to check if Prisma client exists
check_prisma() {
    if [ -f "node_modules/.prisma/client/index.js" ]; then
        echo "✅ Prisma client found"
        return 0
    else
        echo "❌ Prisma client not found"
        return 1
    fi
}

# Function to generate Prisma client with retries
generate_prisma() {
    local retries=3
    local count=0
    
    while [ $count -lt $retries ]; do
        echo "🔧 Generating Prisma client (attempt $((count + 1))/$retries)..."
        
        if npx prisma generate; then
            echo "✅ Prisma client generated successfully"
            return 0
        else
            echo "❌ Prisma generation failed, attempt $((count + 1))/$retries"
            count=$((count + 1))
            sleep 2
        fi
    done
    
    echo "❌ Failed to generate Prisma client after $retries attempts"
    return 1
}

# Ensure Prisma client is available
if ! check_prisma; then
    generate_prisma
fi

# Verify Prisma client exists before continuing
if ! check_prisma; then
    echo "❌ Cannot start server: Prisma client unavailable"
    exit 1
fi

# Run database migrations (optional, don't fail if DB not ready)
echo "🗃️ Attempting database migrations..."
if npx prisma migrate deploy; then
    echo "✅ Database migrations completed"
else
    echo "⚠️ Database migrations failed or skipped (database may not be ready yet)"
fi

# Start the server
echo "🚀 Starting Node.js server..."
exec node dist/index.js