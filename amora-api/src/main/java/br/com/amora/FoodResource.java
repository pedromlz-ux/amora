package br.com.amora;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/alimentos")
@Produces(MediaType.APPLICATION_JSON)
public class FoodResource {

    @Inject
    FoodService foodService;

    @GET
    public List<Food> getAll(@QueryParam("db") String database) {
        if ("tbca".equalsIgnoreCase(database)) {
            return foodService.getTbcaFoods();
        }
        return foodService.getTacoFoods();
    }

    @GET
    @Path("/busca")
    public List<Food> search(@QueryParam("q") String query, @QueryParam("db") String database) {
        return foodService.search(query, database);
    }
}
