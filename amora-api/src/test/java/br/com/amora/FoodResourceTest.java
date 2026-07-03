package br.com.amora;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
public class FoodResourceTest {

    @Test
    public void testGetAllEndpoint() {
        given()
          .when().get("/api/alimentos?db=taco")
          .then()
             .statusCode(200)
             .body("size()", notNullValue());
    }

    @Test
    public void testGetAllTbcaEndpoint() {
        given()
          .when().get("/api/alimentos?db=tbca")
          .then()
             .statusCode(200)
             .body("size()", notNullValue());
    }

    @Test
    public void testSearchEndpoint() {
        given()
          .when().get("/api/alimentos/busca?q=arroz&db=taco")
          .then()
             .statusCode(200)
             .body("size()", notNullValue());
    }

    @Test
    public void testSearchTbcaEndpoint() {
        given()
          .when().get("/api/alimentos/busca?q=arroz&db=tbca")
          .then()
             .statusCode(200)
             .body("size()", notNullValue());
    }
}
