package br.com.amora;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.runtime.Startup;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Startup
@ApplicationScoped
public class FoodService {

    private List<Food> tacoFoods = new ArrayList<>();
    private List<Food> tbcaFoods = new ArrayList<>();

    @Inject
    ObjectMapper mapper;

    @PostConstruct
    void init() {
        // Load TACO
        try (InputStream is = getClass().getResourceAsStream("/TACO.json")) {
            if (is != null) {
                tacoFoods = mapper.readValue(is, new TypeReference<List<Food>>() {});
                System.out.println("Loaded " + tacoFoods.size() + " foods from TACO/IBGE database.");
            } else {
                System.err.println("Could not find TACO.json in resources.");
            }
        } catch (Exception e) {
            System.err.println("Error loading TACO/IBGE database: " + e.getMessage());
        }

        // Load TBCA
        try (InputStream is = getClass().getResourceAsStream("/TBCA.json")) {
            if (is != null) {
                List<Food> temp = new ArrayList<>();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                    String line;
                    long idCounter = 10000; // Offset to avoid ID collision
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty()) continue;
                        try {
                            RawTbcaFood raw = mapper.readValue(line, RawTbcaFood.class);
                            Food food = new Food();
                            food.id = idCounter++;
                            food.description = raw.descricao;
                            food.category = raw.classe;
                            
                            // Map nutritional values to standard fields
                            if (raw.nutrientes != null) {
                                for (RawTbcaFood.Nutriente n : raw.nutrientes) {
                                    String val = n.ValorPor100g != null ? n.ValorPor100g.replace(",", ".") : "NA";
                                    if ("Energia".equalsIgnoreCase(n.Componente) && "kcal".equalsIgnoreCase(n.Unidades)) {
                                        food.setNutritionData("energy_kcal", val);
                                    } else if ("Proteína".equalsIgnoreCase(n.Componente)) {
                                        food.setNutritionData("protein_g", val);
                                    } else if ("Carboidrato total".equalsIgnoreCase(n.Componente) || "Carboidrato disponível".equalsIgnoreCase(n.Componente)) {
                                        // Prefer total or available, we can just save it under carbohydrate_g
                                        food.setNutritionData("carbohydrate_g", val);
                                    } else if ("Lipídios".equalsIgnoreCase(n.Componente)) {
                                        food.setNutritionData("lipid_g", val);
                                    }
                                }
                            }
                            temp.add(food);
                        } catch (Exception e) {
                            // Skip malformed lines if any
                        }
                    }
                }
                tbcaFoods = temp;
                System.out.println("Loaded " + tbcaFoods.size() + " foods from TBCA database.");
            } else {
                System.err.println("Could not find TBCA.json in resources.");
            }
        } catch (Exception e) {
            System.err.println("Error loading TBCA database: " + e.getMessage());
        }
    }

    public List<Food> getTacoFoods() {
        return tacoFoods;
    }

    public List<Food> getTbcaFoods() {
        return tbcaFoods;
    }

    public List<Food> search(String query, String database) {
        List<Food> targetList = "tbca".equalsIgnoreCase(database) ? tbcaFoods : tacoFoods;
        if (query == null || query.isBlank()) {
            return targetList;
        }
        String lowerQuery = query.toLowerCase();
        return targetList.stream()
                .filter(f -> f.description != null && f.description.toLowerCase().contains(lowerQuery))
                .collect(Collectors.toList());
    }
}
