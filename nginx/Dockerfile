FROM nginx:1.25-alpine

# Remove default nginx website
RUN rm /etc/nginx/nginx.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# The nginx user and group already exist in the base image
# Just ensure proper permissions
RUN chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
