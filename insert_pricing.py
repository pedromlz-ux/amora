with open("public/precos.html", "r") as f:
    lines = f.readlines()

# The pricing section is lines 48 to 101 (index 47 to 101)
pricing_html = "".join(lines[47:101])

# We need to change the <section> to have id="precos" and remove padding-top so it fits nicely
pricing_html = pricing_html.replace(
    '<section class="section--spacious container" style="padding-top:calc(var(--header-height) + var(--space-3xl))">',
    '<!-- ============ Pricing ============ -->\n<section class="section bg-white" id="precos">\n<div class="container">'
)
# And add </div> before the closing </section>
pricing_html = pricing_html.replace('</section>', '</div>\n</section>')

with open("public/index.html", "r") as f:
    index_content = f.read()

# We want to insert it right before <!-- ============ CTA Banner ============ -->
insert_marker = "<!-- ============ CTA Banner ============ -->"

if insert_marker in index_content:
    new_index = index_content.replace(insert_marker, pricing_html + "\n\n" + insert_marker)
    with open("public/index.html", "w") as f:
        f.write(new_index)
    print("Successfully inserted pricing section.")
else:
    print("Could not find insert marker.")
