# Use the official lightweight Nginx image based on Alpine Linux
FROM nginx:alpine

# Set working directory to Nginx html root
WORKDIR /usr/share/nginx/html

# Remove default static files
RUN rm -rf ./*

# Copy all workspace files (HTML and assets) into the Nginx container
COPY . .

# Create a symlink so marketplace-kitchen.html is served as the default page (index.html)
# This keeps the original file names intact while allowing visitors to access the root URL
RUN ln -sf marketplace-kitchen.html index.html

# Expose port 80 for web traffic
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
