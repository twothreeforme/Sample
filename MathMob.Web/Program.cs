using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Behind a reverse proxy (IIS / nginx / Caddy) the original scheme and client IP arrive in X-Forwarded-* headers.
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Serve the game (wwwroot/index.html and the ES modules under wwwroot/src).
// In development, disable caching so edits show up on refresh.
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        if (app.Environment.IsDevelopment())
            ctx.Context.Response.Headers.CacheControl = "no-store";
    }
});

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.Run();
